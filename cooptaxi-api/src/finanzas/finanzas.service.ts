// finanzas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
const dayjs = require('dayjs');
import { Cuota, TipoCuota, MetodoPago } from './entities/cuota.entity';

export class CreateCuotaDto {
  @IsUUID()
  socio_id: string;
  @IsEnum(TipoCuota)
  tipo: TipoCuota;
  @IsNumber() @Min(0)
  monto: number;
  @IsString()
  fecha_vencimiento: string;
  @IsOptional() @IsString()
  descripcion?: string;
}

export class PagarCuotaDto {
  @IsNumber() @Min(0)
  monto: number;
  @IsEnum(MetodoPago)
  metodo: MetodoPago;
  @IsOptional() @IsString()
  comprobante?: string;
}

@Injectable()
export class FinanzasService {
  constructor(
    @InjectRepository(Cuota)
    private readonly repo: Repository<Cuota>,
  ) {}

  async createCuota(dto: CreateCuotaDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async findAll(filters: {
    pagada?: boolean;
    user_id?: string;
    tipo?: TipoCuota;
    page?: number;
    limit?: number;
  }) {
    const { pagada, user_id, tipo, page = 1, limit = 20 } = filters;
    const qb = this.repo.createQueryBuilder('c')
      .leftJoinAndSelect('c.socio', 's');

    if (pagada !== undefined) qb.andWhere('c.pagada = :pagada', { pagada });
    if (user_id) qb.andWhere('c.socio_id = :user_id', { user_id });
    if (tipo) qb.andWhere('c.tipo = :tipo', { tipo });

    const [data, total] = await qb
      .orderBy('c.fecha_vencimiento', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const total_pendiente = data
      .filter((c) => !c.pagada)
      .reduce((s, c) => s + Number(c.monto), 0);

    return { data, total, total_pendiente: Number(total_pendiente.toFixed(2)) };
  }

  async pagar(id: string, dto: PagarCuotaDto) {
    const cuota = await this.repo.findOne({ where: { id }, relations: ['socio'] });
    if (!cuota) throw new NotFoundException('Cuota no encontrada');

    cuota.pagada = true;
    cuota.fecha_pago = new Date();
    cuota.metodo_pago = dto.metodo;
    cuota.comprobante = dto.comprobante || '';
    await this.repo.save(cuota);

    // Verificar si el socio quedó sin mora
    const pendientes = await this.repo.count({
      where: { socio_id: cuota.socio_id, pagada: false },
    });

    return {
      cuota_id: id,
      pagada: true,
      socio_desbloqueado: pendientes === 0,
    };
  }

  async reporte(desde: string, hasta: string) {
    const cuotas = await this.repo
      .createQueryBuilder('c')
      .where('c.pagada = true')
      .andWhere('c.fecha_pago >= :desde', { desde })
      .andWhere('c.fecha_pago <= :hasta', { hasta })
      .getMany();

    const total_recaudado = cuotas.reduce((s, c) => s + Number(c.monto), 0);

    const socios_en_mora = await this.repo
      .createQueryBuilder('c')
      .select('COUNT(DISTINCT c.socio_id)', 'count')
      .where('c.pagada = false')
      .andWhere('c.fecha_vencimiento < :hoy', { hoy: dayjs().format('YYYY-MM-DD') })
      .getRawOne();

    return {
      total_recaudado: Number(total_recaudado.toFixed(2)),
      cuotas_cobradas: cuotas.filter((c) => c.tipo === TipoCuota.MENSUAL).length,
      multas_cobradas: cuotas.filter((c) => c.tipo === TipoCuota.MULTA).length,
      socios_en_mora: Number(socios_en_mora?.count ?? 0),
    };
  }
}
