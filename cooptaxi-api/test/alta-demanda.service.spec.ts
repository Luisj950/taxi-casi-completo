import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { AltaDemandaService } from '../../src/alta-demanda/alta-demanda.service';
import { AltaDemandaEvento, EstadoAltaDemanda } from '../../src/alta-demanda/entities/alta-demanda-evento.entity';
import { Carrera, EstadoCarrera } from '../../src/despacho/entities/carrera.entity';
import { User, UserRol, EstadoChofer } from '../../src/users/entities/user.entity';
import { NotificacionesService } from '../../src/notificaciones/notificaciones.service';
import { DespachoGateway } from '../../src/despacho/despacho.gateway';

const conductoresInactivos = [
  { id: 'c1', fcm_token: 'tok1', estado_chofer: EstadoChofer.INACTIVO, rol: UserRol.CHOFER, activo: true },
  { id: 'c2', fcm_token: 'tok2', estado_chofer: EstadoChofer.INACTIVO, rol: UserRol.CHOFER, activo: true },
  { id: 'c3', fcm_token: null,   estado_chofer: EstadoChofer.INACTIVO, rol: UserRol.CHOFER, activo: true }, // sin token
];

const mockEventoRepo = {
  save:         jest.fn().mockImplementation((e) => Promise.resolve({ id: 'evt-1', ...e })),
  create:       jest.fn().mockImplementation((e) => e),
  update:       jest.fn().mockResolvedValue({}),
  findOne:      jest.fn().mockResolvedValue({ id: 'evt-1', conductores_respondieron: 0 }),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  count:        jest.fn(),
};

const mockCarreraRepo = { count: jest.fn() };
const mockUserRepo    = { count: jest.fn(), find: jest.fn(), findOne: jest.fn(), update: jest.fn() };
const mockNotif       = { sendMulticast: jest.fn().mockResolvedValue({}) };
const mockGateway     = { broadcastCola: jest.fn(), notificarChofer: jest.fn() };
const mockQueue       = { add: jest.fn() };

describe('AltaDemandaService', () => {
  let service: AltaDemandaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AltaDemandaService,
        { provide: getRepositoryToken(AltaDemandaEvento), useValue: mockEventoRepo },
        { provide: getRepositoryToken(Carrera),           useValue: mockCarreraRepo },
        { provide: getRepositoryToken(User),              useValue: mockUserRepo },
        { provide: getQueueToken('despacho'),             useValue: mockQueue },
        { provide: NotificacionesService,                 useValue: mockNotif },
        { provide: DespachoGateway,                       useValue: mockGateway },
        { provide: ConfigService,                         useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<AltaDemandaService>(AltaDemandaService);
    jest.clearAllMocks();
    // Resetear estado interno
    (service as any).eventoActivoId = null;
    (service as any).notifCount.clear();
  });

  describe('monitorearCola()', () => {
    it('no activa si hay menos de 5 pendientes', async () => {
      mockCarreraRepo.count.mockResolvedValue(4);
      mockUserRepo.count.mockResolvedValue(2);

      await service.monitorearCola();

      expect(mockEventoRepo.save).not.toHaveBeenCalled();
      expect(mockNotif.sendMulticast).not.toHaveBeenCalled();
    });

    it('activa cuando hay 5 o más pendientes', async () => {
      mockCarreraRepo.count.mockResolvedValue(5);
      mockUserRepo.count.mockResolvedValue(0);
      mockUserRepo.find.mockResolvedValue(conductoresInactivos);

      await service.monitorearCola();

      expect(mockEventoRepo.save).toHaveBeenCalled();
      // Solo notifica a los que tienen fcm_token (c1 y c2, no c3)
      expect(mockNotif.sendMulticast).toHaveBeenCalledWith(
        expect.arrayContaining(['tok1', 'tok2']),
        expect.stringContaining('Alta demanda'),
        expect.any(String),
      );
    });

    it('no activa si ya hay un evento activo', async () => {
      (service as any).eventoActivoId = 'evento-existente';
      mockCarreraRepo.count.mockResolvedValue(10);
      mockUserRepo.count.mockResolvedValue(0);

      await service.monitorearCola();

      expect(mockEventoRepo.save).not.toHaveBeenCalled();
    });

    it('resuelve el evento cuando la cola se normaliza', async () => {
      (service as any).eventoActivoId = 'evt-activo';
      mockCarreraRepo.count.mockResolvedValue(1);
      mockUserRepo.count.mockResolvedValue(3);

      await service.monitorearCola();

      expect(mockEventoRepo.update).toHaveBeenCalledWith(
        'evt-activo',
        expect.objectContaining({ estado: EstadoAltaDemanda.RESUELTO }),
      );
      expect((service as any).eventoActivoId).toBeNull();
    });
  });

  describe('conductorRespondioLlamado()', () => {
    it('sube al conductor al puesto #1 y cambia estado a DISPONIBLE', async () => {
      (service as any).eventoActivoId = 'evt-activo';
      mockUserRepo.findOne.mockResolvedValue({
        id: 'c1',
        estado_chofer: EstadoChofer.INACTIVO,
      });

      await service.conductorRespondioLlamado('c1');

      expect(mockUserRepo.update).toHaveBeenCalledWith('c1', {
        estado_chofer: EstadoChofer.DISPONIBLE,
        posicion_cola: 0,
      });
      expect(mockGateway.notificarChofer).toHaveBeenCalledWith(
        'c1', 'alta_demanda_bienvenida', expect.objectContaining({ posicion: 1 }),
      );
    });

    it('no hace nada si no hay evento activo', async () => {
      (service as any).eventoActivoId = null;
      await service.conductorRespondioLlamado('c1');
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });

    it('no afecta a conductores que ya estaban disponibles', async () => {
      (service as any).eventoActivoId = 'evt-activo';
      mockUserRepo.findOne.mockResolvedValue({
        id: 'c1',
        estado_chofer: EstadoChofer.DISPONIBLE, // ya estaba disponible
      });

      await service.conductorRespondioLlamado('c1');
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('control de frecuencia de notificaciones', () => {
    it('no notifica a un conductor que ya recibió 3 notificaciones en 24h', async () => {
      // Simular que c1 ya recibió 3 notificaciones
      const ahora = new Date();
      (service as any).notifCount.set('c1', { count: 3, ultima: ahora });

      mockCarreraRepo.count.mockResolvedValue(5);
      mockUserRepo.count.mockResolvedValue(0);
      mockUserRepo.find.mockResolvedValue([conductoresInactivos[0]]); // solo c1

      await service.monitorearCola();

      // No debe enviarse ninguna notificación porque c1 ya llegó al límite
      expect(mockNotif.sendMulticast).toHaveBeenCalledWith(
        [],
        expect.any(String),
        expect.any(String),
      );
    });
  });
});
