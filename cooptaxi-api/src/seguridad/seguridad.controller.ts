// seguridad.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { SeguridadService } from './seguridad.service';
import { TipoIncidente } from './entities/incidente.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRol } from '../users/entities/user.entity';

class PanicoDto {
  @IsNumber() lat: number;
  @IsNumber() lng: number;
  @IsUUID() @IsOptional() carrera_id?: string;
}

class IncidenteDto {
  @IsEnum(TipoIncidente) tipo: TipoIncidente;
  @IsString() descripcion: string;
  @IsNumber() @IsOptional() lat?: number;
  @IsNumber() @IsOptional() lng?: number;
  @IsUUID() @IsOptional() carrera_id?: string;
}

@ApiTags('seguridad')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('seguridad')
export class SeguridadController {
  constructor(private readonly svc: SeguridadService) {}

  @Post('panico')
  @Roles(UserRol.CHOFER)
  panico(@Request() req: any, @Body() dto: PanicoDto) {
    return this.svc.activarPanico(req.user.id, dto);
  }

  @Post('incidentes')
  @Roles(UserRol.CHOFER, UserRol.DESPACHADOR)
  crear(@Request() req: any, @Body() dto: IncidenteDto) {
    return this.svc.crearIncidente(req.user.id, dto);
  }

  @Get('incidentes')
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR)
  findAll(
    @Query('tipo') tipo?: TipoIncidente,
    @Query('desde') desde?: string,
    @Query('page') page?: number,
  ) {
    return this.svc.findAll({ tipo, desde, page });
  }
}
