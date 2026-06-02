import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { UserRol } from '../../src/users/entities/user.entity';

const mockUser = {
  id: 'uuid-1',
  nombre: 'Test User',
  email: 'test@coop.com',
  password_hash: '',
  rol: UserRol.CHOFER,
  activo: true,
  rating_promedio: 5.0,
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;

  beforeAll(async () => {
    mockUser.password_hash = await bcrypt.hash('Password123!', 12);
  });

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      setRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock_token'),
            verify: jest.fn().mockReturnValue({ sub: 'uuid-1', email: 'test@coop.com', rol: UserRol.CHOFER }),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock_secret') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login()', () => {
    it('retorna tokens si las credenciales son correctas', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@coop.com',
        password: 'Password123!',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.email).toBe('test@coop.com');
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@coop.com', password: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'test@coop.com', password: 'wrong_password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario está inactivo', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser, activo: false,
      });

      await expect(
        service.login({ email: 'test@coop.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout()', () => {
    it('invalida el refresh token', async () => {
      await service.logout('uuid-1');
      expect(usersService.setRefreshToken).toHaveBeenCalledWith('uuid-1', null);
    });
  });
});
