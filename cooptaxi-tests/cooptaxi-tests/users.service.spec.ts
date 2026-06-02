import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../src/users/users.service';
import { User, UserRol, EstadoChofer } from '../../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

const mockUser: Partial<User> = {
  id:              'user-1',
  nombre:          'Roberto Morales',
  email:           'r.morales@coop.com',
  password_hash:   '$2b$12$hashedpassword',
  rol:             UserRol.CHOFER,
  activo:          true,
  rating_promedio: 4.8,
  total_carreras:  20,
  posicion_cola:   1,
  estado_chofer:   EstadoChofer.DISPONIBLE,
  cuotas:          [],
};

const mockRepo = {
  create:  jest.fn((d) => ({ ...mockUser, ...d })),
  save:    jest.fn((d) => Promise.resolve(d)),
  findOne: jest.fn(),
  update:  jest.fn().mockResolvedValue({}),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere:          jest.fn().mockReturnThis(),
    skip:              jest.fn().mockReturnThis(),
    take:              jest.fn().mockReturnThis(),
    getManyAndCount:   jest.fn().mockResolvedValue([[mockUser], 1]),
  })),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ── create ───────────────────────────────────────────────────
  describe('create()', () => {
    it('crea un usuario y hashea la contraseña', async () => {
      mockRepo.findOne.mockResolvedValue(null); // email libre
      const dto = {
        nombre: 'Nuevo Chofer', email: 'nuevo@coop.com',
        password: 'Password123!', rol: UserRol.CHOFER,
      };
      await service.create(dto);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ password_hash: expect.any(String) }),
      );
      // Verificar que no guardó la contraseña en texto plano
      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.password_hash).not.toBe('Password123!');
    });

    it('lanza ConflictException si el email ya existe', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      await expect(service.create({
        nombre: 'Test', email: 'r.morales@coop.com', password: '123',
      })).rejects.toThrow(ConflictException);
    });
  });

  // ── findOne ──────────────────────────────────────────────────
  describe('findOne()', () => {
    it('retorna el usuario si existe', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.findOne('user-1');
      expect(result.email).toBe('r.morales@coop.com');
    });

    it('lanza NotFoundException si no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  // ── tieneMora ────────────────────────────────────────────────
  describe('tieneMora()', () => {
    it('retorna true si tiene cuotas sin pagar', async () => {
      mockRepo.findOne.mockResolvedValue({
        ...mockUser,
        cuotas: [{ pagada: false, monto: 48 }],
      });
      expect(await service.tieneMora('user-1')).toBe(true);
    });

    it('retorna false si todas las cuotas están pagadas', async () => {
      mockRepo.findOne.mockResolvedValue({
        ...mockUser,
        cuotas: [{ pagada: true, monto: 48 }],
      });
      expect(await service.tieneMora('user-1')).toBe(false);
    });

    it('retorna false si no tiene cuotas', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockUser, cuotas: [] });
      expect(await service.tieneMora('user-1')).toBe(false);
    });
  });

  // ── actualizarRating ─────────────────────────────────────────
  describe('actualizarRating()', () => {
    it('calcula el promedio acumulado correctamente', async () => {
      mockRepo.findOne.mockResolvedValue({
        ...mockUser,
        rating_promedio: 4.0,
        total_carreras:  10,
      });

      await service.actualizarRating('user-1', 5);

      const savedUser = mockRepo.save.mock.calls[0][0];
      // Promedio: (4.0 * 10 + 5) / 11 = 4.09...
      expect(savedUser.rating_promedio).toBeCloseTo(4.09, 1);
      expect(savedUser.total_carreras).toBe(11);
    });

    it('usa la nueva calificación directamente si es la primera carrera', async () => {
      mockRepo.findOne.mockResolvedValue({
        ...mockUser, rating_promedio: 5.0, total_carreras: 0,
      });
      await service.actualizarRating('user-1', 3);
      const savedUser = mockRepo.save.mock.calls[0][0];
      expect(savedUser.rating_promedio).toBe(3);
    });
  });

  // ── setEstado ────────────────────────────────────────────────
  describe('setEstado()', () => {
    it('activa un usuario inactivo', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockUser, activo: false });
      const result = await service.setEstado('user-1', true);
      expect(result.activo).toBe(true);
    });

    it('desactiva un usuario activo', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockUser, activo: true });
      const result = await service.setEstado('user-1', false);
      expect(result.activo).toBe(false);
    });
  });
});
