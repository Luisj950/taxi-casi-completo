// despacho.controller.ts
import {
  Controller, Post, Patch, Get, Body, Param,
  Query, UseGuards, Request, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DespachoService } from './despacho.service';
import {
  SolicitarCarreraDto, ResponderCarreraDto, CompletarCarreraDto,
} from './dto/despacho.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ChoferActivoGuard } from '../common/guards/chofer-activo.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRol } from '../users/entities/user.entity';
import { EstadoCarrera } from './entities/carrera.entity';

@ApiTags('despacho')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('despacho')
export class DespachoController {
  constructor(private readonly svc: DespachoService) {}

  @Post('carreras')
  @Roles(UserRol.PASAJERO, UserRol.DESPACHADOR)
  solicitar(@Request() req: any, @Body() dto: SolicitarCarreraDto) {
    return this.svc.solicitar(req.user.id, dto);
  }

  @Patch('carreras/:id/responder')
  @Roles(UserRol.CHOFER)
  @UseGuards(ChoferActivoGuard)
  responder(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResponderCarreraDto,
  ) {
    return this.svc.responder(req.user.id, id, dto);
  }

  @Patch('carreras/:id/completar')
  @Roles(UserRol.CHOFER)
  completar(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompletarCarreraDto,
  ) {
    return this.svc.completar(req.user.id, id, dto);
  }

  @Get('carreras/:id')
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR, UserRol.CHOFER, UserRol.PASAJERO)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Get('carreras')
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR, UserRol.CHOFER)
  findAll(
    @Query('chofer_id') chofer_id?: string,
    @Query('estado') estado?: EstadoCarrera,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.svc.findAll({ chofer_id, estado, desde, hasta, page, limit });
  }

  @Get('cola')
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR)
  getCola() {
    return this.svc.getCola();
  }
}
