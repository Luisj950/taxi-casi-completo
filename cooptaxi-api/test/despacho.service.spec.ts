import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DespachoService } from '../../src/despacho/despacho.service';
import { Carrera, EstadoCarrera } from '../../src/despacho/entities/carrera.entity';
import { User } from '../../src/users/entities/user.entity';
import { UsersService } from '../../src/users/users.service';
import { DespachoGateway } from '../../src/despacho/despacho.gateway';
import { AccionCarrera } from '../../src/despacho/dto/despacho.dto';

const mockCarreraRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
  find: jest.fn(),
};

const mockUserRepo = {
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockQueue = {
  add: jest.fn().mockResolvedValue({}),
};

const mockUsersService = {
  setEstadoChofer: jest.fn(),
  actualizarRating: jest.fn(),
  tieneMora: jest.fn().mockResolvedValue(false),
};

const mockGateway = {
  notificarPasajero: jest.fn(),
  notificarChofer: jest.fn(),
  broadcastCola: jest.fn(),
};

describe('DespachoService', () => {
  let service: DespachoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DespachoService,
        { provide: getRepositoryToken(Carrera), useValue: mockCarreraRepo },
        { provide: getRepositoryToken(User),    useValue: mockUserRepo },
        { provide: getQueueToken('despacho'),   useValue: mockQueue },
        { provide: UsersService,                useValue: mockUsersService },
        { provide: DespachoGateway,             useValue: mockGateway },
      ],
    }).compile();

    service = module.get<DespachoService>(DespachoService);
    jest.clearAllMocks();
  });

  describe('solicitar()', () => {
    it('crea la carrera y la encola en Bull', async () => {
      const carrera = { id: 'carrera-uuid', estado: EstadoCarrera.PENDIENTE };
      mockCarreraRepo.create.mockReturnValue(carrera);
      mockCarreraRepo.save.mockResolvedValue(carrera);

      const result = await service.solicitar('pasajero-uuid', {
        origen:  { lat: -2.9001, lng: -79.0059, descripcion: 'Parque Calderón' },
        destino: { lat: -2.9123, lng: -79.0145, descripcion: 'Terminal' },
      });

      expect(mockCarreraRepo.save).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('asignar', { carrera_id: 'carrera-uuid' }, expect.any(Object));
      expect(result.estado).toBe(EstadoCarrera.PENDIENTE);
    });
  });

  describe('responder()', () => {
    const carrera = {
      id: 'carrera-uuid',
      chofer_id: 'chofer-uuid',
      pasajero_id: 'pasajero-uuid',
      estado: EstadoCarrera.ASIGNADA,
    };

    it('cambia estado a EN_RUTA si el chofer acepta', async () => {
      mockCarreraRepo.findOne.mockResolvedValue({ ...carrera });
      mockCarreraRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.responder('chofer-uuid', 'carrera-uuid', {
        accion: AccionCarrera.ACEPTAR,
      });

      expect(result.estado).toBe(EstadoCarrera.EN_RUTA);
      expect(mockGateway.notificarPasajero).toHaveBeenCalled();
    });

    it('re-encola si el chofer rechaza', async () => {
      mockCarreraRepo.findOne.mockResolvedValue({ ...carrera });
      mockCarreraRepo.save.mockImplementation((c) => Promise.resolve(c));

      await service.responder('chofer-uuid', 'carrera-uuid', {
        accion: AccionCarrera.RECHAZAR,
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'asignar',
        expect.objectContaining({ rechazado_por: 'chofer-uuid' }),
        expect.any(Object),
      );
    });

    it('lanza NotFoundException si la carrera no existe', async () => {
      mockCarreraRepo.findOne.mockResolvedValue(null);

      await expect(
        service.responder('chofer-uuid', 'no-existe', { accion: AccionCarrera.ACEPTAR }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si no es el chofer asignado', async () => {
      mockCarreraRepo.findOne.mockResolvedValue({ ...carrera, chofer_id: 'otro-uuid' });

      await expect(
        service.responder('chofer-uuid', 'carrera-uuid', { accion: AccionCarrera.ACEPTAR }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
