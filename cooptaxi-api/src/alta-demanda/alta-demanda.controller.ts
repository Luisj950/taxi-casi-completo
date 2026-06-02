import {
  Controller, Get, Post, Query,
  UseGuards, Request, ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AltaDemandaService } from './alta-demanda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRol } from '../users/entities/user.entity';

@ApiTags('alta-demanda')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alta-demanda')
export class AltaDemandaController {
  constructor(private readonly svc: AltaDemandaService) {}

  // Estado actual — útil para que el panel del despachador muestre el banner
  @Get('estado')
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR)
  @ApiOperation({ summary: 'Estado actual del modo alta demanda' })
  getEstado() {
    return this.svc.getEstadoActual();
  }

  // Historial de eventos para reportes
  @Get('historial')
  @Roles(UserRol.ADMIN)
  @ApiOperation({ summary: 'Historial de eventos de alta demanda' })
  getHistorial(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.getHistorial(page, limit);
  }

  // Activación manual desde el panel (el despachador ve que hay muchas llamadas)
  @Post('activar')
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR)
  @ApiOperation({ summary: 'Activar alta demanda manualmente' })
  activarManual(@Request() req: any) {
    return this.svc.activarManual(req.user.id);
  }

  // El conductor toca "Conectarme" desde la notificación push
  // Este endpoint lo llama la app del conductor al abrir la notificación
  @Post('responder')
  @Roles(UserRol.CHOFER)
  @ApiOperation({ summary: 'Conductor responde al llamado de alta demanda' })
  responder(@Request() req: any) {
    return this.svc.conductorRespondioLlamado(req.user.id);
  }
}
