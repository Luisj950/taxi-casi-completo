import {
  Injectable, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RefreshDto, RegisterPasajeroDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';
import { UserRol } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  async registerPasajero(dto: RegisterPasajeroDto) {
    const user = await this.usersService.create({
      nombre:   dto.nombre,
      email:    dto.email,
      password: dto.password,
      telefono: dto.telefono,
      rol:      UserRol.PASAJERO,
    });
    const tokens = await this.generateTokens(user.id, user.email, user.rol);
    await this.usersService.setRefreshToken(user.id, tokens.refresh_token);
    return {
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    if (!user.activo) throw new UnauthorizedException('Cuenta desactivada');

    const tokens = await this.generateTokens(user.id, user.email, user.rol);
    await this.usersService.setRefreshToken(user.id, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        rating_promedio: user.rating_promedio,
      },
    };
  }

  async refresh(dto: RefreshDto) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(dto.refresh_token, {
        secret: this.cfg.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user?.refresh_token_hash) throw new UnauthorizedException();

    const match = await bcrypt.compare(dto.refresh_token, user.refresh_token_hash);
    if (!match) throw new UnauthorizedException('Refresh token no coincide');

    const tokens = await this.generateTokens(user.id, user.email, user.rol);
    await this.usersService.setRefreshToken(user.id, tokens.refresh_token);
    return { access_token: tokens.access_token };
  }

  async logout(userId: string) {
    await this.usersService.setRefreshToken(userId, null);
    return { message: 'Sesión cerrada' };
  }

  private async generateTokens(id: string, email: string, rol: string) {
    const payload: JwtPayload = { sub: id, email, rol };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.cfg.get('JWT_SECRET'),
        expiresIn: this.cfg.get('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.cfg.get('JWT_REFRESH_SECRET'),
        expiresIn: this.cfg.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { access_token, refresh_token };
  }
}
