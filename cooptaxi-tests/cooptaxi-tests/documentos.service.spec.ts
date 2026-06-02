import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DocumentosService } from '../../src/documentos/documentos.service';
import { Documento, TipoDocumento } from '../../src/documentos/entities/documento.entity';
import { NotificacionesService } from '../../src/notificaciones/notificaciones.service';
import * as dayjs from 'dayjs';

const hoy       = dayjs().format('YYYY-MM-DD');
const en10dias  = dayjs().add(10, 'day').format('YYYY-MM-DD');
const en20dias  = dayjs().add(20, 'day').format('YYYY-MM-DD');
const vencido   = dayjs().subtract(5, 'day').format('YYYY-MM-DD');

const mockDocs: Partial<Documento>[] = [
  {
    id: 'd1', user_id: 'u1', tipo: TipoDocumento.LICENCIA,
    fecha_vencimiento: en10dias, alerta_enviada: false,
    user: { id: 'u1', nombre: 'Roberto M.' } as any,
  },
  {
    id: 'd2', user_id: 'u2', tipo: TipoDocumento.SPPAT,
    fecha_vencimiento: en20dias, alerta_enviada: false,
    user: { id: 'u2', nombre: 'Manuel C.', fcm_token: 'tok123' } as any,
  },
  {
    id: 'd3', user_id: 'u3', tipo: TipoDocumento.RTV,
    fecha_vencimiento: vencido, alerta_enviada: true,
    user: { id: 'u3', nombre: 'Jorge Q.' } as any,
  },
];

const mockRepo = {
  create:  jest.fn((d) => d),
  save:    jest.fn((d) => Promise.resolve({ id: 'new-d', ...d })),
  findOne: jest.fn(),
  find:    jest.fn(),
  update:  jest.fn().mockResolvedValue({}),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere:          jest.fn().mockReturnThis(),
    where:             jest.fn().mockReturnThis(),
    orderBy:           jest.fn().mockReturnThis(),
    getMany:           jest.fn().mockResolvedValue(
      mockDocs.map((d) => ({
        ...d,
        dias_restantes: dayjs(d.fecha_vencimiento).diff(dayjs(), 'day'),
      }))
    ),
  })),
};

const mockNotif = {
  sendPush: jest.fn().mockResolvedValue(undefined),
};

describe('DocumentosService', () => {
  let service: DocumentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosService,
        { provide: getRepositoryToken(Documento), useValue: mockRepo },
        { provide: NotificacionesService,         useValue: mockNotif },
      ],
    }).compile();

    service = module.get<DocumentosService>(DocumentosService);
    jest.clearAllMocks();
  });

  // ── create ───────────────────────────────────────────────────
  describe('create()', () => {
    it('crea un documento correctamente', async () => {
      const dto = {
        user_id: 'u1',
        tipo: TipoDocumento.LICENCIA,
        fecha_vencimiento: en20dias,
        numero_documento: 'LIC-001',
      };
      await service.create(dto);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  // ── findAll ──────────────────────────────────────────────────
  describe('findAll()', () => {
    it('retorna documentos con dias_restantes calculados', async () => {
      const result = await service.findAll({ dias: 15 });
      expect(Array.isArray(result)).toBe(true);
      result.forEach((d) => {
        expect(d).toHaveProperty('dias_restantes');
        expect(typeof d.dias_restantes).toBe('number');
      });
    });

    it('filtra correctamente por tipo', async () => {
      await service.findAll({ tipo: TipoDocumento.LICENCIA, dias: 30 });
      expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  // ── update ───────────────────────────────────────────────────
  describe('update()', () => {
    it('actualiza el documento y resetea alerta_enviada', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockDocs[2] }); // alerta_enviada: true
      const result = await service.update('d3', {
        fecha_vencimiento: en20dias,
        numero_documento:  'RTV-2026',
      });
      // alerta_enviada debe resetearse a false
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ alerta_enviada: false }),
      );
    });

    it('lanza NotFoundException si el documento no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update('no-existe', {}))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── checkVencimientos (cron) ─────────────────────────────────
  describe('checkVencimientos()', () => {
    it('envía push a conductores con documentos próximos a vencer', async () => {
      // Doc con usuario con fcm_token
      mockRepo.find.mockResolvedValue([
        {
          ...mockDocs[1],
          user: { id: 'u2', nombre: 'Manuel C.', fcm_token: 'tok123' },
        },
      ]);

      await service.checkVencimientos();

      expect(mockNotif.sendPush).toHaveBeenCalledWith(
        'tok123',
        expect.stringContaining('SPPAT'),
        expect.any(String),
      );
      expect(mockRepo.update).toHaveBeenCalledWith(
        expect.any(String),
        { alerta_enviada: true },
      );
    });

    it('no envía push si el usuario no tiene fcm_token', async () => {
      mockRepo.find.mockResolvedValue([
        {
          ...mockDocs[0],
          user: { id: 'u1', nombre: 'Roberto M.', fcm_token: null },
        },
      ]);

      await service.checkVencimientos();
      expect(mockNotif.sendPush).not.toHaveBeenCalled();
    });

    it('no procesa documentos con alerta ya enviada', async () => {
      // find con where alerta_enviada: false retorna vacío
      mockRepo.find.mockResolvedValue([]);
      await service.checkVencimientos();
      expect(mockNotif.sendPush).not.toHaveBeenCalled();
    });
  });
});
