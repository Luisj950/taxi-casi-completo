// flota.controller.ts
import {
  Controller, Get, Post, Body, Param,
  Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  FlotaService, CreateVehiculoDto, CreateMantenimientoDto,
} from './flota.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRol } from '../users/entities/user.entity';

@ApiTags('flota')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('flota')
export class FlotaController {
  constructor(private readonly svc: FlotaService) {}

  @Post('vehiculos')
  @Roles(UserRol.ADMIN)
  create(@Body() dto: CreateVehiculoDto) {
    return this.svc.createVehiculo(dto);
  }

  @Get('vehiculos')
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR)
  findAll(
    @Query('activo') activo?: boolean,
    @Query('page') page?: number,
  ) {
    return this.svc.findAll({ activo, page });
  }

  @Get('vehiculos/:id')
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Post('vehiculos/:id/mantenimiento')
  @Roles(UserRol.ADMIN, UserRol.MECANICO)
  mantenimiento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMantenimientoDto,
  ) {
    return this.svc.registrarMantenimiento(id, dto);
  }

  @Get('vehiculos/:id/mantenimiento')
  @Roles(UserRol.ADMIN, UserRol.MECANICO, UserRol.DESPACHADOR)
  historial(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.historialMantenimiento(id);
  }
}
