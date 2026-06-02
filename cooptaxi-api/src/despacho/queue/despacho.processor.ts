import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Job } from 'bull';
import { DESPACHO_QUEUE } from './despacho.service';
import { Carrera, EstadoCarrera } from './entities/carrera.entity';
import { User, UserRol, EstadoChofer } from '../users/entities/user.entity';
import { DespachoGateway } from './despacho.gateway';

@Processor(DESPACHO_QUEUE)
export class DespachoProcessor {
  private readonly logger = new Logger(DespachoProcessor.name);

  constructor(
    @InjectRepository(Carrera)
    private readonly carreraRepo: Repository<Carrera>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gateway: DespachoGateway,
  ) {}

  @Process('asignar')
  async handleAsignar(job: Job<{ carrera_id: string; rechazado_por?: string }>) {
    const { carrera_id, rechazado_por } = job.data;

    const carrera = await this.carreraRepo.findOne({ where: { id: carrera_id } });
    if (!carrera || carrera.estado === EstadoCarrera.CANCELADA) {
      this.logger.log(`Carrera ${carrera_id} cancelada o no encontrada, ignorando.`);
      return;
    }

    // Buscar siguiente chofer disponible, sin mora, ordenado por posicion_cola
    const qb = this.userRepo.createQueryBuilder('u')
      .leftJoinAndSelect('u.cuotas', 'cuotas')
      .leftJoinAndSelect('u.vehiculo', 'vehiculo')
      .where('u.rol = :rol', { rol: UserRol.CHOFER })
      .andWhere('u.activo = true')
      .andWhere('u.estado_chofer = :estado', { estado: EstadoChofer.DISPONIBLE })
      .orderBy('u.posicion_cola', 'ASC');

    if (rechazado_por) {
      qb.andWhere('u.id != :rechazado_por', { rechazado_por });
    }

    const choferes = await qb.getMany();
    // Filtrar los que tienen mora
    const elegible = choferes.find((c) => !c.cuotas.some((q) => !q.pagada));

    if (!elegible) {
      this.logger.warn(`Sin choferes disponibles para carrera ${carrera_id}`);
      return;
    }

    // Asignar
    carrera.chofer_id = elegible.id;
    carrera.estado = EstadoCarrera.ASIGNADA;
    await this.carreraRepo.save(carrera);

    // Notificar al chofer vía WebSocket con timeout de 60s
    this.gateway.notificarChofer(elegible.id, 'carrera_incoming', {
      carrera_id,
      pasajero_id: carrera.pasajero_id,
      origen: { lat: carrera.origen_lat, lng: carrera.origen_lng, descripcion: carrera.origen_descripcion },
      destino: { lat: carrera.destino_lat, lng: carrera.destino_lng, descripcion: carrera.destino_descripcion },
      timeout_seg: 60,
    });

    this.logger.log(`Carrera ${carrera_id} asignada a chofer ${elegible.id}`);
  }
}
