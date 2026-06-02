// finanzas.controller.ts
import {
  Controller, Get, Post, Body, Param,
  Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FinanzasService, CreateCuotaDto, PagarCuotaDto } from './finanzas.service';
import { TipoCuota } from './entities/cuota.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRol } from '../users/entities/user.entity';

@ApiTags('finanzas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finanzas')
export class FinanzasController {
  constructor(private readonly svc: FinanzasService) {}

  @Post('cuotas')
  @Roles(UserRol.ADMIN)
  create(@Body() dto: CreateCuotaDto) {
    return this.svc.createCuota(dto);
  }

  @Get('cuotas')
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR)
  findAll(
    @Query('pagada') pagada?: boolean,
    @Query('user_id') user_id?: string,
    @Query('tipo') tipo?: TipoCuota,
    @Query('page') page?: number,
  ) {
    return this.svc.findAll({ pagada, user_id, tipo, page });
  }

  @Post('cuotas/:id/pagar')
  @Roles(UserRol.ADMIN)
  pagar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PagarCuotaDto,
  ) {
    return this.svc.pagar(id, dto);
  }

  @Get('reporte')
  @Roles(UserRol.ADMIN)
  reporte(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.svc.reporte(desde, hasta);
  }
}
