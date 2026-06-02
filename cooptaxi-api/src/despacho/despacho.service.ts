import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Carrera, EstadoCarrera } from './entities/carrera.entity';
import { User, EstadoChofer } from '../users/entities/user.entity';
import {
  SolicitarCarreraDto, ResponderCarreraDto,
  CompletarCarreraDto, AccionCarrera,
} from './dto/despacho.dto';
import { UsersService } from '../users/users.service';
import { DespachoGateway } from './despacho.gateway';

export const DESPACHO_QUEUE = 'despacho';

@Injectable()
export class DespachoService {
  constructor(
    @InjectRepository(Carrera)
    private readonly carreraRepo: Repository<Carrera>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectQueue(DESPACHO_QUEUE)
    private readonly queue: Queue,
    private readonly usersService: UsersService,
    private readonly gateway: DespachoGateway,
  ) {}

  // ─── Crear carrera y encolar ──────────────────────────
  async solicitar(pasajeroId: string, dto: SolicitarCarreraDto) {
    const carrera = this.carreraRepo.create({
      pasajero_id: pasajeroId,
      origen_lat: dto.origen.lat,
      origen_lng: dto.origen.lng,
      origen_descripcion: dto.origen.descripcion,
      destino_lat: dto.destino.lat,
      destino_lng: dto.destino.lng,
      destino_descripcion: dto.destino.descripcion,
      estado: EstadoCarrera.PENDIENTE,
    });
    await this.carreraRepo.save(carrera);

    // Encolar job: el processor busca al siguiente chofer válido
    await this.queue.add('asignar', { carrera_id: carrera.id }, {
      attempts: 5,          // reintentos si el chofer rechaza
      backoff: { type: 'fixed', delay: 62_000 }, // 62s (timeout + margen)
      removeOnComplete: true,
    });

    return {
      carrera_id: carrera.id,
      estado: carrera.estado,
      chofer_asignado: null,
      tiempo_espera_est: 3,
    };
  }

  // ─── Chofer acepta o rechaza ──────────────────────────
  async responder(chofer_id: string, carrera_id: string, dto: ResponderCarreraDto) {
    const carrera = await this.carreraRepo.findOne({ where: { id: carrera_id } });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');
    if (carrera.chofer_id !== chofer_id) {
      throw new BadRequestException('Esta carrera no está asignada a ti');
    }
    if (carrera.estado !== EstadoCarrera.ASIGNADA) {
      throw new BadRequestException('La carrera ya no está disponible');
    }

    if (dto.accion === AccionCarrera.ACEPTAR) {
      carrera.estado = EstadoCarrera.EN_RUTA;
      carrera.inicio_en_ruta = new Date();
      await this.carreraRepo.save(carrera);
      await this.usersService.setEstadoChofer(chofer_id, EstadoChofer.EN_CARRERA);
      this.gateway.notificarPasajero(carrera.pasajero_id, 'carrera_confirmada', {
        carrera_id, chofer_id,
      });
    } else {
      // Rechazó: desasignar y re-encolar para el siguiente
      carrera.chofer_id = null;
      carrera.estado = EstadoCarrera.PENDIENTE;
      await this.carreraRepo.save(carrera);
      await this.usersService.setEstadoChofer(chofer_id, EstadoChofer.DISPONIBLE);
      await this.queue.add('asignar', { carrera_id, rechazado_por: chofer_id }, {
        attempts: 4,
        removeOnComplete: true,
      });
    }

    return { carrera_id, estado: carrera.estado, chofer_id };
  }

  // ─── Completar carrera ────────────────────────────────
  async completar(chofer_id: string, carrera_id: string, dto: CompletarCarreraDto) {
    const carrera = await this.carreraRepo.findOne({ where: { id: carrera_id } });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');
    if (carrera.chofer_id !== chofer_id) throw new BadRequestException();

    const ahora = new Date();
    const inicio = carrera.inicio_en_ruta ?? carrera.created_at;
    carrera.estado = EstadoCarrera.COMPLETADA;
    carrera.fin_carrera = ahora;
    carrera.duracion_min = Math.round((ahora.getTime() - inicio.getTime()) / 60_000);
    carrera.calificacion = dto.calificacion;
    carrera.comentario = dto.comentario;
    await this.carreraRepo.save(carrera);

    // Actualizar rating del chofer y liberarlo
    await this.usersService.actualizarRating(chofer_id, dto.calificacion);
    await this.usersService.setEstadoChofer(chofer_id, EstadoChofer.DISPONIBLE);

    // Broadcast nueva cola a despachadores
    this.gateway.broadcastCola();

    return {
      carrera_id,
      estado: carrera.estado,
      duracion_min: carrera.duracion_min,
    };
  }

  // ─── Historial ────────────────────────────────────────
  async findAll(filters: {
    chofer_id?: string;
    estado?: EstadoCarrera;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }) {
    const { chofer_id, estado, desde, hasta, page = 1, limit = 20 } = filters;
    const qb = this.carreraRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.chofer', 'chofer')
      .leftJoinAndSelect('c.pasajero', 'pasajero');

    if (chofer_id) qb.andWhere('c.chofer_id = :chofer_id', { chofer_id });
    if (estado) qb.andWhere('c.estado = :estado', { estado });
    if (desde) qb.andWhere('c.created_at >= :desde', { desde });
    if (hasta) qb.andWhere('c.created_at <= :hasta', { hasta });

    const [data, total] = await qb
      .orderBy('c.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page };
  }

  // ─── Cola actual (para despachador) ──────────────────
  async getCola() {
    const choferes = await this.userRepo.find({
      where: { activo: true },
      relations: ['vehiculo', 'cuotas'],
      order: { posicion_cola: 'ASC' },
    });

    return {
      cola: choferes
        .filter((u) => u.rol === 'CHOFER')
        .map((u, i) => ({
          posicion: i + 1,
          chofer_id: u.id,
          nombre: u.nombre,
          placa: u.vehiculo?.placa ?? '—',
          estado: u.cuotas.some((c) => !c.pagada) ? 'BLOQUEADO' : u.estado_chofer,
          rating: u.rating_promedio,
        })),
    };
  }
}
