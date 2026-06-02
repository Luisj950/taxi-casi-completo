import {
  Controller, Get, Post, Patch, Param,
  Body, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRol } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Post()
  @Roles(UserRol.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.svc.create(dto);
  }

  @Get()
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR)
  @ApiQuery({ name: 'rol', enum: UserRol, required: false })
  @ApiQuery({ name: 'activo', type: Boolean, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  findAll(
    @Query('rol') rol?: UserRol,
    @Query('activo') activo?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.svc.findAll({ rol, activo, page, limit });
  }

  @Get(':id')
  @Roles(UserRol.ADMIN, UserRol.DESPACHADOR, UserRol.CHOFER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRol.ADMIN, UserRol.CHOFER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/estado')
  @Roles(UserRol.ADMIN)
  setEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('activo') activo: boolean,
  ) {
    return this.svc.setEstado(id, activo);
  }
}
