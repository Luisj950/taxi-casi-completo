// seguridad.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incidente } from './entities/incidente.entity';
import { SeguridadService } from './seguridad.service';
import { SeguridadGateway } from './seguridad.gateway';
import { SeguridadController } from './seguridad.controller';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([Incidente]), NotificacionesModule],
  providers: [SeguridadService, SeguridadGateway],
  controllers: [SeguridadController],
})
export class SeguridadModule {}
