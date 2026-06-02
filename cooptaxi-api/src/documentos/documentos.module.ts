import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documento } from './entities/documento.entity';
import { DocumentosService } from './documentos.service';
import { DocumentosController } from './documentos.controller';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([Documento]), NotificacionesModule],
  providers: [DocumentosService],
  controllers: [DocumentosController],
  exports: [DocumentosService],
})
export class DocumentosModule {}
