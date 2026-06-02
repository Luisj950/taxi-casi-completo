import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cuota } from './entities/cuota.entity';
import { FinanzasService } from './finanzas.service';
import { FinanzasController } from './finanzas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota])],
  providers: [FinanzasService],
  controllers: [FinanzasController],
  exports: [FinanzasService],
})
export class FinanzasModule {}
