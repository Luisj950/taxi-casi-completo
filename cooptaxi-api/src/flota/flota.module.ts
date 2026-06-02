import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { Mantenimiento } from './entities/mantenimiento.entity';
import { FlotaService } from './flota.service';
import { FlotaController } from './flota.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo, Mantenimiento])],
  providers: [FlotaService],
  controllers: [FlotaController],
  exports: [FlotaService],
})
export class FlotaModule {}
