import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FinanzasService } from '../../src/finanzas/finanzas.service';
import { Cuota, TipoCuota, MetodoPago } from '../../src/finanzas/entities/cuota.entity';

const mockCuotas: Partial<Cuota>[] = [
  { id: 'c1', socio_id: 'socio-1', tipo: TipoCuota.MENSUAL, monto: 48, fecha_vencimiento: '2026-05-01', pagada: false },
  { id: 'c2', socio_id: 'socio-1', tipo: TipoCuota.MULTA,   monto: 20, fecha_vencimiento: '2026-04-01', pagada: false },
  { id: 'c3', socio_id: 'socio-2', tipo: TipoCuota.MENSUAL, monto: 48, fecha_vencimiento: '2026-05-01', pagada: true  },
];

const mockRepo = {
  create:     jest.fn((d) => d),
  save:       jest.fn((d) => Promise.resolve({ id: 'new-uuid', ...d })),
  findOne:    jest.fn(),
  update:     jest.fn().mockResolvedValue({}),
  count:      jest.fn().mockResolvedValue(0),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere:          jest.fn().mockReturnThis(),
    orderBy:           jest.fn().mockReturnThis(),
    skip:              jest.fn().mockReturnThis(),
    take:              jest.fn().mockReturnThis(),
    where:             jest.fn().mockReturnThis(),
    select:            jest.fn().mockReturnThis(),
    getManyAndCount:   jest.fn().mockResolvedValue([mockCuotas, mockCuotas.length]),
    getMany:           jest.fn().mockResolvedValue(mockCuotas.filter(c => c.pagada)),
    getRawOne:         jest.fn().mockResolvedValue({ count: '2' }),
  })),
};

describe('FinanzasService', () => {
  let service: FinanzasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanzasService,
        { provide: getRepositoryToken(Cuota), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<FinanzasService>(FinanzasService);
    jest.clearAllMocks();
  });

  // ── createCuota ─────────────────────────────────────────────
  describe('createCuota()', () => {
    it('crea y guarda una cuota correctamente', async () => {
      const dto = {
        socio_id: 'socio-1',
        tipo: TipoCuota.MENSUAL,
        monto: 48,
        fecha_vencimiento: '2026-06-01',
        descripcion: 'Cuota junio',
      };
      const result = await service.createCuota(dto);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  // ── findAll ──────────────────────────────────────────────────
  describe('findAll()', () => {
    it('retorna lista paginada de cuotas', async () => {
      const result = await service.findAll({ pagada: false, page: 1, limit: 20 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('total_pendiente');
    });

    it('calcula correctamente el total pendiente', async () => {
      mockRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere:          jest.fn().mockReturnThis(),
        orderBy:           jest.fn().mockReturnThis(),
        skip:              jest.fn().mockReturnThis(),
        take:              jest.fn().mockReturnThis(),
        getManyAndCount:   jest.fn().mockResolvedValue([
          [
            { ...mockCuotas[0], pagada: false },
            { ...mockCuotas[1], pagada: false },
          ],
          2,
        ]),
      });
      const result = await service.findAll({});
      // 48 + 20 = 68
      expect(result.total_pendiente).toBe(68);
    });
  });

  // ── pagar ────────────────────────────────────────────────────
  describe('pagar()', () => {
    it('marca la cuota como pagada', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockCuotas[0], socio: { nombre: 'Test' } });
      mockRepo.save.mockResolvedValue({ ...mockCuotas[0], pagada: true });
      mockRepo.count.mockResolvedValue(0); // sin mora restante

      const result = await service.pagar('c1', {
        monto: 48,
        metodo: MetodoPago.EFECTIVO,
        comprobante: 'REC-001',
      });

      expect(result.pagada).toBe(true);
      expect(result.socio_desbloqueado).toBe(true);
    });

    it('lanza NotFoundException si la cuota no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.pagar('no-existe', { monto: 48, metodo: MetodoPago.EFECTIVO }))
        .rejects.toThrow(NotFoundException);
    });

    it('socio_desbloqueado es false si aún tiene mora', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockCuotas[0], socio: { nombre: 'Test' } });
      mockRepo.save.mockResolvedValue({ ...mockCuotas[0], pagada: true });
      mockRepo.count.mockResolvedValue(1); // aún tiene 1 cuota pendiente

      const result = await service.pagar('c1', { monto: 48, metodo: MetodoPago.EFECTIVO });
      expect(result.socio_desbloqueado).toBe(false);
    });
  });

  // ── reporte ──────────────────────────────────────────────────
  describe('reporte()', () => {
    it('retorna métricas financieras del período', async () => {
      const result = await service.reporte('2026-05-01', '2026-05-31');
      expect(result).toHaveProperty('total_recaudado');
      expect(result).toHaveProperty('cuotas_cobradas');
      expect(result).toHaveProperty('multas_cobradas');
      expect(result).toHaveProperty('socios_en_mora');
      expect(typeof result.total_recaudado).toBe('number');
    });
  });
});
