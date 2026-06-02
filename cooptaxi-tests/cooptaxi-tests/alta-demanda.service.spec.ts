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

const choforesInactivos = [
  { id: 'ch1', fcm_token: 'tok1', estado_chofer: EstadoChofer.INACTIVO, rol: UserRol.CHOFER, activo: true },
  { id: 'ch2', fcm_token: 'tok2', estado_chofer: EstadoChofer.INACTIVO, rol: UserRol.CHOFER, activo: true },
  { id: 'ch3', fcm_token: null,   estado_chofer: EstadoChofer.INACTIVO, rol: UserRol.CHOFER, activo: true },
];

const mockEventoRepo = {
  create:       jest.fn((d) => d),
  save:         jest.fn().mockImplementation((d) => Promise.resolve({ id: 'evt-1', ...d })),
  update:       jest.fn().mockResolvedValue({}),
  findOne:      jest.fn().mockResolvedValue({ id: 'evt-1', conductores_respondieron: 0 }),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
};

const mockCarreraRepo = { count: jest.fn() };
const mockUserRepo    = {
  count:    jest.fn(),
  find:     jest.fn(),
  findOne:  jest.fn(),
  update:   jest.fn().mockResolvedValue({}),
};
const mockNotif  = { sendMulticast: jest.fn().mockResolvedValue({}) };
const mockGw     = { broadcastCola: jest.fn(), notificarChofer: jest.fn() };
const mockQueue  = { add: jest.fn() };
const mockConfig = { get: jest.fn() };

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
        { provide: DespachoGateway,                       useValue: mockGw },
        { provide: ConfigService,                         useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AltaDemandaService>(AltaDemandaService);
    jest.clearAllMocks();
    (service as any).eventoActivoId = null;
    (service as any).notifCount.clear();
  });

  // ── monitorearCola ───────────────────────────────────────────
  describe('monitorearCola()', () => {
    it('NO activa si hay menos de 5 solicitudes pendientes', async () => {
      mockCarreraRepo.count.mockResolvedValue(4);
      mockUserRepo.count.mockResolvedValue(2);
      await service.monitorearCola();
      expect(mockEventoRepo.save).not.toHaveBeenCalled();
    });

    it('activa cuando hay exactamente 5 solicitudes pendientes', async () => {
      mockCarreraRepo.count.mockResolvedValue(5);
      mockUserRepo.count.mockResolvedValue(0);
      mockUserRepo.find.mockResolvedValue(choforesInactivos);
      await service.monitorearCola();
      expect(mockEventoRepo.save).toHaveBeenCalled();
    });

    it('NO activa si ya hay un evento activo', async () => {
      (service as any).eventoActivoId = 'evento-existente';
      mockCarreraRepo.count.mockResolvedValue(10);
      mockUserRepo.count.mockResolvedValue(0);
      await service.monitorearCola();
      expect(mockEventoRepo.save).not.toHaveBeenCalled();
    });

    it('solo notifica choferes con fcm_token', async () => {
      mockCarreraRepo.count.mockResolvedValue(5);
      mockUserRepo.count.mockResolvedValue(0);
      mockUserRepo.find.mockResolvedValue(choforesInactivos);
      await service.monitorearCola();
      expect(mockNotif.sendMulticast).toHaveBeenCalledWith(
        expect.arrayContaining(['tok1', 'tok2']),
        expect.any(String),
        expect.any(String),
      );
      // ch3 no tiene fcm_token — no debe estar en el array
      expect(mockNotif.sendMulticast).toHaveBeenCalledWith(
        expect.not.arrayContaining([null]),
        expect.any(String),
        expect.any(String),
      );
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

  // ── conductorRespondioLlamado ─────────────────────────────────
  describe('conductorRespondioLlamado()', () => {
    it('sube al conductor al puesto #1 y lo marca DISPONIBLE', async () => {
      (service as any).eventoActivoId = 'evt-activo';
      mockUserRepo.findOne.mockResolvedValue({
        id: 'ch1', estado_chofer: EstadoChofer.INACTIVO,
      });
      await service.conductorRespondioLlamado('ch1');
      expect(mockUserRepo.update).toHaveBeenCalledWith('ch1', {
        estado_chofer: EstadoChofer.DISPONIBLE,
        posicion_cola: 0,
      });
      expect(mockGw.notificarChofer).toHaveBeenCalledWith(
        'ch1', 'alta_demanda_bienvenida',
        expect.objectContaining({ posicion: 1 }),
      );
    });

    it('no hace nada si no hay evento activo', async () => {
      (service as any).eventoActivoId = null;
      await service.conductorRespondioLlamado('ch1');
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });

    it('no afecta a conductores que ya estaban DISPONIBLE', async () => {
      (service as any).eventoActivoId = 'evt-activo';
      mockUserRepo.findOne.mockResolvedValue({
        id: 'ch1', estado_chofer: EstadoChofer.DISPONIBLE,
      });
      await service.conductorRespondioLlamado('ch1');
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  // ── límite de notificaciones ──────────────────────────────────
  describe('control de frecuencia', () => {
    it('no notifica a conductor que ya recibió 3 notificaciones en 24h', async () => {
      (service as any).notifCount.set('ch1', { count: 3, ultima: new Date() });
      mockCarreraRepo.count.mockResolvedValue(5);
      mockUserRepo.count.mockResolvedValue(0);
      mockUserRepo.find.mockResolvedValue([choforesInactivos[0]]); // solo ch1
      await service.monitorearCola();
      expect(mockNotif.sendMulticast).toHaveBeenCalledWith(
        [], expect.any(String), expect.any(String),
      );
    });
  });

  // ── getEstadoActual ───────────────────────────────────────────
  describe('getEstadoActual()', () => {
    it('retorna el estado correcto del modo alta demanda', async () => {
      mockCarreraRepo.count.mockResolvedValue(7);
      mockUserRepo.count.mockResolvedValue(2);
      (service as any).eventoActivoId = 'evt-test';

      const estado = await service.getEstadoActual();
      expect(estado.modo_alta_demanda).toBe(true);
      expect(estado.solicitudes_pendientes).toBe(7);
      expect(estado.conductores_disponibles).toBe(2);
    });
  });
});
