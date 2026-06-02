import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Carrera } from './entities/carrera.entity';
import { User } from '../users/entities/user.entity';
import { DespachoService, DESPACHO_QUEUE } from './despacho.service';
import { DespachoController } from './despacho.controller';
import { DespachoGateway } from './despacho.gateway';
import { DespachoProcessor } from './queue/despacho.processor';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Carrera, User]),
    BullModule.registerQueue({ name: DESPACHO_QUEUE }),
    UsersModule,
  ],
  providers: [DespachoService, DespachoGateway, DespachoProcessor],
  controllers: [DespachoController],
  exports: [DespachoService, DespachoGateway],
})
export class DespachoModule {}
