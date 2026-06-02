import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Interval } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';

import {
  AltaDemandaEvento,
  EstadoAltaDemanda,
} from './entities/alta-demanda-evento.entity';
import { Carrera, EstadoCarrera } from '../despacho/entities/carrera.entity';
import { User, UserRol, EstadoChofer } from '../users/entities/user.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { DespachoGateway } from '../despacho/despacho.gateway';
import { DESPACHO_QUEUE } from '../despacho/despacho.service';

// ─── Constantes de negocio ────────────────────────────────────────────────────
const UMBRAL_SOLICITUDES      = 5;   // solicitudes pendientes para activar
const MAX_NOTIF_POR_CONDUCTOR = 3;   // máx notificaciones por conductor en 24h
const TTL_COOLDOWN_HORAS      = 24;  // horas antes de volver a notificar al mismo conductor
const INTERVALO_MONITOREO_MS  = 60_000; // revisa la cola cada 60 segundos

@Injectable()
export class AltaDemandaService {
  private readonly logger = new Logger(AltaDemandaService.name);

  // Mapa en memoria: conductor_id → cantidad de notificaciones enviadas hoy
  // Se complementa con Redis para persistencia entre reinicios
  private readonly notifCount = new Map<string, { count: number; ultima: Date }>();

  // Para no activar múltiples eventos simultáneos
  private eventoActivoId: string | null = null;

  constructor(
    @InjectRepository(AltaDemandaEvento)
    private readonly eventoRepo: Repository<AltaDemandaEvento>,
    @InjectRepository(Carrera)
    private readonly carreraRepo: Repository<Carrera>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectQueue(DESPACHO_QUEUE)
    private readonly queue: Queue,
    private readonly notif: NotificacionesService,
    private readonly gateway: DespachoGateway,
    private readonly cfg: ConfigService,
  ) {}

  // ─── Monitor principal — corre cada 60 segundos ──────────────────────────
  @Interval(INTERVALO_MONITOREO_MS)
  async monitorearCola(): Promise<void> {
    const pendientes = await this.carreraRepo.count({
      where: { estado: EstadoCarrera.PENDIENTE },
    });

    const disponibles = await this.userRepo.count({
      where: {
        rol: UserRol.CHOFER,
        activo: true,
        estado_chofer: EstadoChofer.DISPONIBLE,
      },
    });

    this.logger.debug(
      `Monitor cola → pendientes: ${pendientes} | disponibles: ${disponibles}`,
    );

    // ── Activar alta demanda ──────────────────────────────────────────────
    if (pendientes >= UMBRAL_SOLICITUDES && !this.eventoActivoId) {
      await this.activarAltaDemanda(pendientes);
      return;
    }

    // ── Resolver si ya hay choferes suficientes ───────────────────────────
    if (this.eventoActivoId && disponibles > 0 && pendientes < UMBRAL_SOLICITUDES) {
      await this.resolverAltaDemanda();
    }
  }

  // ─── Activación ──────────────────────────────────────────────────────────
  private async activarAltaDemanda(pendientes: number): Promise<void> {
    this.logger.warn(`🔴 Alta demanda activada — ${pendientes} solicitudes pendientes`);

    // Crear registro del evento
    const evento = await this.eventoRepo.save(
      this.eventoRepo.create({ solicitudes_pendientes: pendientes }),
    );
    this.eventoActivoId = evento.id;

    // Buscar conductores inactivos con FCM token y que no hayan recibido
    // demasiadas notificaciones en las últimas 24h
    const conductoresInactivos = await this.userRepo.find({
      where: {
        rol: UserRol.CHOFER,
        activo: true,
        estado_chofer: EstadoChofer.INACTIVO,
      },
    });

    const elegibles = conductoresInactivos.filter((c) =>
      c.fcm_token && this.puedeNotificar(c.id),
    );

    if (elegibles.length === 0) {
      this.logger.warn('Sin conductores inactivos elegibles para notificar');
      return;
    }

    // Enviar push a todos los elegibles
    const tokens = elegibles.map((c) => c.fcm_token).filter(Boolean) as string[];

    await this.notif.sendMulticast(
      tokens,
      '🚕 Alta demanda — ¡Te necesitamos!',
      `Hay ${pendientes} carreras esperando en tu zona. Conéctate ahora y te asignamos directo al puesto #1 de la cola.`,
    );

    // Notificar también por WebSocket al panel del despachador
    this.gateway.broadcastCola();

    // Actualizar contadores de notificaciones
    for (const c of elegibles) {
      this.registrarNotificacion(c.id);
    }

    // Actualizar el evento con los conductores notificados
    await this.eventoRepo.update(evento.id, {
      conductores_notificados: elegibles.length,
    });

    this.logger.log(
      `✅ Notificados ${elegibles.length} conductores inactivos (de ${conductoresInactivos.length} totales)`,
    );
  }

  // ─── El conductor se conecta respondiendo al llamado ─────────────────────
  async conductorRespondioLlamado(conductorId: string): Promise<void> {
    if (!this.eventoActivoId) return;

    // Incentivo: subir al puesto #1 de la cola
    // Esto se logra poniendo su posicion_cola = 0 (menor que cualquier otro)
    const conductor = await this.userRepo.findOne({ where: { id: conductorId } });
    if (!conductor) return;

    // Verificar que realmente estaba inactivo (no un chofer ya disponible)
    if (conductor.estado_chofer !== EstadoChofer.INACTIVO) return;

    await this.userRepo.update(conductorId, {
      estado_chofer: EstadoChofer.DISPONIBLE,
      posicion_cola: 0, // puesto #1
    });

    // Registrar en el evento
    const evento = await this.eventoRepo.findOne({
      where: { id: this.eventoActivoId },
    });
    if (evento) {
      await this.eventoRepo.update(this.eventoActivoId, {
        conductores_respondieron: evento.conductores_respondieron + 1,
      });
    }

    this.logger.log(
      `Conductor ${conductorId} respondió al llamado → subido a puesto #1`,
    );

    // Emitir confirmación al conductor por WebSocket
    this.gateway.notificarChofer(conductorId, 'alta_demanda_bienvenida', {
      mensaje: '¡Gracias por conectarte! Estás en el puesto #1 de la cola.',
      posicion: 1,
    });
  }

  // ─── Resolución ──────────────────────────────────────────────────────────
  private async resolverAltaDemanda(): Promise<void> {
    if (!this.eventoActivoId) return;

    await this.eventoRepo.update(this.eventoActivoId, {
      estado: EstadoAltaDemanda.RESUELTO,
      resuelto_en: new Date(),
    });

    this.logger.log(`✅ Alta demanda resuelta — evento ${this.eventoActivoId}`);
    this.eventoActivoId = null;
  }

  // ─── Control de frecuencia de notificaciones ─────────────────────────────
  private puedeNotificar(conductorId: string): boolean {
    const registro = this.notifCount.get(conductorId);
    if (!registro) return true;

    const horasTranscurridas = dayjs().diff(dayjs(registro.ultima), 'hour');

    // Resetear contador si pasaron más de TTL_COOLDOWN_HORAS
    if (horasTranscurridas >= TTL_COOLDOWN_HORAS) {
      this.notifCount.delete(conductorId);
      return true;
    }

    return registro.count < MAX_NOTIF_POR_CONDUCTOR;
  }

  private registrarNotificacion(conductorId: string): void {
    const registro = this.notifCount.get(conductorId);
    if (registro) {
      registro.count += 1;
      registro.ultima = new Date();
    } else {
      this.notifCount.set(conductorId, { count: 1, ultima: new Date() });
    }
  }

  // ─── Endpoints para el panel admin ───────────────────────────────────────
  async getEstadoActual() {
    const pendientes = await this.carreraRepo.count({
      where: { estado: EstadoCarrera.PENDIENTE },
    });
    const disponibles = await this.userRepo.count({
      where: {
        rol: UserRol.CHOFER,
        activo: true,
        estado_chofer: EstadoChofer.DISPONIBLE,
      },
    });

    return {
      modo_alta_demanda: !!this.eventoActivoId,
      evento_activo_id: this.eventoActivoId,
      solicitudes_pendientes: pendientes,
      conductores_disponibles: disponibles,
      umbral: UMBRAL_SOLICITUDES,
    };
  }

  async getHistorial(page = 1, limit = 20) {
    const [data, total] = await this.eventoRepo.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page };
  }

  // Activación manual desde el panel del despachador (emergencias)
  async activarManual(conductorId: string): Promise<{ mensaje: string }> {
    const pendientes = await this.carreraRepo.count({
      where: { estado: EstadoCarrera.PENDIENTE },
    });

    if (!this.eventoActivoId) {
      await this.activarAltaDemanda(Math.max(pendientes, UMBRAL_SOLICITUDES));
    }

    return { mensaje: `Alta demanda activada manualmente. ${pendientes} solicitudes pendientes.` };
  }
}
