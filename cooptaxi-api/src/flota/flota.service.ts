// flota.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo, TipoMantenimiento } from './entities/vehiculo.entity';
import { Mantenimiento } from './entities/mantenimiento.entity';

export class CreateVehiculoDto {
  socio_id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color?: string;
}

export class CreateMantenimientoDto {
  tipo: TipoMantenimiento;
  descripcion?: string;
  km_actual?: number;
  fecha?: string;
  costo?: number;
}

@Injectable()
export class FlotaService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
    @InjectRepository(Mantenimiento)
    private readonly mantRepo: Repository<Mantenimiento>,
  ) {}

  async createVehiculo(dto: CreateVehiculoDto) {
    return this.vehiculoRepo.save(this.vehiculoRepo.create(dto));
  }

  async findAll(filters: { activo?: boolean; page?: number; limit?: number }) {
    const { activo, page = 1, limit = 20 } = filters;
    const qb = this.vehiculoRepo.createQueryBuilder('v')
      .leftJoinAndSelect('v.socio', 's')
      .leftJoinAndSelect('v.documentos', 'd');

    if (activo !== undefined) qb.andWhere('v.activo = :activo', { activo });

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((v) => ({
        ...v,
        documentos_vencidos: v.documentos.filter(
          (d) => new Date(d.fecha_vencimiento) < new Date(),
        ).length,
      })),
      total,
    };
  }

  async findOne(id: string) {
    const v = await this.vehiculoRepo.findOne({
      where: { id },
      relations: ['socio', 'documentos'],
    });
    if (!v) throw new NotFoundException('Vehículo no encontrado');
    return v;
  }

  async registrarMantenimiento(vehiculo_id: string, dto: CreateMantenimientoDto) {
    const vehiculo = await this.findOne(vehiculo_id);

    const mant = this.mantRepo.create({
      vehiculo_id,
      ...dto,
      km_proximo: dto.km_actual ? dto.km_actual + 5000 : undefined,
    });

    if (dto.km_actual) {
      await this.vehiculoRepo.update(vehiculo_id, { km_actual: dto.km_actual });
    }

    return this.mantRepo.save(mant);
  }

  async historialMantenimiento(vehiculo_id: string) {
    return this.mantRepo.find({
      where: { vehiculo_id },
      order: { created_at: 'DESC' },
    });
  }
}
