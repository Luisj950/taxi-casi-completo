// documentos.controller.ts
import {
  Controller, Get, Post, Patch, Body,
  Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  DocumentosService, CreateDocumentoDto, UpdateDocumentoDto,
} from './documentos.service';
import { TipoDocumento } from './entities/documento.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRol } from '../users/entities/user.entity';

@ApiTags('documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly svc: DocumentosService) {}

  @Get()
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR)
  findAll(
    @Query('dias') dias?: number,
    @Query('tipo') tipo?: TipoDocumento,
    @Query('user_id') user_id?: string,
  ) {
    return this.svc.findAll({ dias, tipo, user_id });
  }

  @Post()
  @Roles(UserRol.ADMIN)
  create(@Body() dto: CreateDocumentoDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @Roles(UserRol.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentoDto,
  ) {
    return this.svc.update(id, dto);
  }
}
