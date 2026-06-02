import {
  IsNumber, IsString, IsOptional, IsEnum,
  IsUUID, Min, Max, IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UbicacionDto {
  @ApiProperty({ example: -2.9001 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -79.0059 })
  @IsNumber()
  lng: number;

  @ApiProperty({ example: 'Parque Calderón', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class SolicitarCarreraDto {
  @ApiProperty()
  origen: UbicacionDto;

  @ApiProperty()
  destino: UbicacionDto;
}

export enum AccionCarrera {
  ACEPTAR  = 'ACEPTAR',
  RECHAZAR = 'RECHAZAR',
}

export class ResponderCarreraDto {
  @ApiProperty({ enum: AccionCarrera })
  @IsEnum(AccionCarrera)
  accion: AccionCarrera;
}

export class CompletarCarreraDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  calificacion: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comentario?: string;
}
