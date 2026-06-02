import {
  IsEmail, IsEnum, IsNotEmpty, IsOptional,
  IsString, Length, MinLength,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserRol } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'Roberto Morales' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  nombre: string;

  @ApiProperty({ example: 'r.morales@coop.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRol, default: UserRol.CHOFER })
  @IsEnum(UserRol)
  @IsOptional()
  rol?: UserRol;

  @ApiProperty({ example: '0102345678', required: false })
  @IsString()
  @Length(10, 10)
  @IsOptional()
  cedula?: string;

  @ApiProperty({ example: '0987654321', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fcm_token?: string;
}
