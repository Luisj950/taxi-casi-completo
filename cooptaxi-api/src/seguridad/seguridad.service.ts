// seguridad.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incidente, TipoIncidente } from './entities/incidente.entity';
import { SeguridadGateway } from './seguridad.gateway';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class SeguridadService {
  constructor(
    @InjectRepository(Incidente)
    private readonly repo: Repository<Incidente>,
    private readonly gateway: SeguridadGateway,
    private readonly notif: NotificacionesService,
  ) {}

  async activarPanico(chofer_id: string, body: { lat: number; lng: number; carrera_id?: string }) {
    const incidente = this.repo.create({
      chofer_id,
      carrera_id: body.carrera_id,
      tipo: TipoIncidente.PANICO,
      lat: body.lat,
      lng: body.lng,
    });
    await this.repo.save(incidente);

    // Emitir a central y choferes cercanos vía WS
    const unidades = this.gateway.emitirPanico({
      chofer_id, lat: body.lat, lng: body.lng,
      incidente_id: incidente.id,
    });

    return { alerta_id: incidente.id, unidades_notificadas: unidades, central_notificada: true };
  }

  async crearIncidente(chofer_id: string, dto: {
    tipo: TipoIncidente; descripcion: string;
    lat?: number; lng?: number; carrera_id?: string;
  }) {
    const i = this.repo.create({ chofer_id, ...dto });
    return this.repo.save(i);
  }

  async findAll(filters: { tipo?: TipoIncidente; desde?: string; page?: number; limit?: number }) {
    const { tipo, desde, page = 1, limit = 20 } = filters;
    const qb = this.repo.createQueryBuilder('i').leftJoinAndSelect('i.chofer', 'c');
    if (tipo) qb.andWhere('i.tipo = :tipo', { tipo });
    if (desde) qb.andWhere('i.created_at >= :desde', { desde });
    const [data, total] = await qb.orderBy('i.created_at', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total };
  }
}
