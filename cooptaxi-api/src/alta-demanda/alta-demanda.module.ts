import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AltaDemandaEvento } from './entities/alta-demanda-evento.entity';
import { AltaDemandaService } from './alta-demanda.service';
import { AltaDemandaController } from './alta-demanda.controller';
import { Carrera } from '../despacho/entities/carrera.entity';
import { User } from '../users/entities/user.entity';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { DespachoModule } from '../despacho/despacho.module';
import { DESPACHO_QUEUE } from '../despacho/despacho.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AltaDemandaEvento, Carrera, User]),
    BullModule.registerQueue({ name: DESPACHO_QUEUE }),
    NotificacionesModule,
    DespachoModule,
  ],
  providers: [AltaDemandaService],
  controllers: [AltaDemandaController],
  exports: [AltaDemandaService],
})
export class AltaDemandaModule {}
