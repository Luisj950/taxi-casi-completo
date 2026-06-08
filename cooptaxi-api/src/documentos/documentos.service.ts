import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import { Documento, TipoDocumento } from './entities/documento.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateDocumentoDto {
  @IsOptional() @IsUUID()
  user_id?: string;
  @IsOptional() @IsUUID()
  vehiculo_id?: string;
  @IsEnum(TipoDocumento)
  tipo: TipoDocumento;
  @IsString()
  fecha_vencimiento: string;
  @IsOptional() @IsString()
  numero_documento?: string;
}

export class UpdateDocumentoDto {
  @IsOptional() @IsString()
  fecha_vencimiento?: string;
  @IsOptional() @IsString()
  numero_documento?: string;
}

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  constructor(
    @InjectRepository(Documento)
    private readonly repo: Repository<Documento>,
    private readonly notif: NotificacionesService,
  ) {}

  async create(dto: CreateDocumentoDto) {
    const doc = this.repo.create(dto);
    return this.repo.save(doc);
  }

  async findAll(filters: {
    dias?: number;
    tipo?: TipoDocumento;
    user_id?: string;
  }) {
    const { tipo, user_id } = filters;
    const dias = Number(filters.dias) || 0;

    const qb = this.repo.createQueryBuilder('d')
      .leftJoinAndSelect('d.user', 'u')
      .leftJoinAndSelect('d.vehiculo', 'v');

    // Si dias > 0 filtrar solo los que vencen en ese rango
    if (dias > 0) {
      const limite = dayjs().add(dias, 'day').format('YYYY-MM-DD');
      qb.where('d.fecha_vencimiento <= :limite', { limite });
    }

    if (tipo) qb.andWhere('d.tipo = :tipo', { tipo });
    if (user_id) qb.andWhere('d.user_id = :user_id', { user_id });

    const docs = await qb.orderBy('d.fecha_vencimiento', 'ASC').getMany();

    return docs.map((d) => ({
      ...d,
      dias_restantes: dayjs(d.fecha_vencimiento).diff(dayjs(), 'day'),
    }));
  }

  async update(id: string, dto: UpdateDocumentoDto) {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    Object.assign(doc, dto, { alerta_enviada: false }); // reset alerta
    return this.repo.save(doc);
  }

  // ─── Cron diario 07:00 ─────────────────────────────────
  @Cron('0 7 * * *', { name: 'check_vencimientos' })
  async checkVencimientos() {
    this.logger.log('Ejecutando check de vencimientos de documentos...');

    const limite = dayjs().add(15, 'day').format('YYYY-MM-DD');
    const docs = await this.repo.find({
      where: {
        fecha_vencimiento: LessThanOrEqual(limite),
        alerta_enviada: false,
      },
      relations: ['user', 'vehiculo'],
    });

    let enviadas = 0;
    for (const doc of docs) {
      const diasRestantes = dayjs(doc.fecha_vencimiento).diff(dayjs(), 'day');
      const titulo = `Documento por vencer — ${doc.tipo}`;
      const cuerpo = `Tu ${doc.tipo} vence en ${diasRestantes} días (${doc.fecha_vencimiento}). Renuévalo a tiempo para seguir operando.`;

      if (doc.user?.fcm_token) {
        await this.notif.sendPush(doc.user.fcm_token, titulo, cuerpo);
      }

      // Marcar alerta enviada para no repetir
      await this.repo.update(doc.id, { alerta_enviada: true });
      enviadas++;
    }

    this.logger.log(`Alertas enviadas: ${enviadas}`);
  }
}
