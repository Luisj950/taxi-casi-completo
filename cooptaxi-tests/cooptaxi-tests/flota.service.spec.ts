import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FlotaService } from '../../src/flota/flota.service';
import { Vehiculo, TipoMantenimiento } from '../../src/flota/entities/vehiculo.entity';
import { Mantenimiento } from '../../src/flota/entities/mantenimiento.entity';

const mockVehiculos = [
  {
    id: 'v1', socio_id: 'u1', placa: 'ABC-1234',
    marca: 'Toyota', modelo: 'Corolla', anio: 2020,
    activo: true, km_actual: 45000,
    socio: { nombre: 'Roberto M.' },
    documentos: [],
  },
  {
    id: 'v2', socio_id: 'u2', placa: 'DEF-5678',
    marca: 'Hyundai', modelo: 'Accent', anio: 2019,
    activo: true, km_actual: 60000,
    socio: { nombre: 'Manuel C.' },
    documentos: [{ fecha_vencimiento: '2020-01-01' }], // vencido
  },
];

const mockVehiculoRepo = {
  create:  jest.fn((d) => d),
  save:    jest.fn((d) => Promise.resolve({ id: 'new-v', ...d })),
  findOne: jest.fn(),
  update:  jest.fn().mockResolvedValue({}),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere:          jest.fn().mockReturnThis(),
    skip:              jest.fn().mockReturnThis(),
    take:              jest.fn().mockReturnThis(),
    getManyAndCount:   jest.fn().mockResolvedValue([mockVehiculos, mockVehiculos.length]),
  })),
};

const mockMantRepo = {
  create: jest.fn((d) => d),
  save:   jest.fn((d) => Promise.resolve({ id: 'mant-1', ...d })),
  find:   jest.fn().mockResolvedValue([]),
};

describe('FlotaService', () => {
  let service: FlotaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlotaService,
        { provide: getRepositoryToken(Vehiculo),     useValue: mockVehiculoRepo },
        { provide: getRepositoryToken(Mantenimiento), useValue: mockMantRepo },
      ],
    }).compile();

    service = module.get<FlotaService>(FlotaService);
    jest.clearAllMocks();
  });

  // ── createVehiculo ───────────────────────────────────────────
  describe('createVehiculo()', () => {
    it('crea un vehículo correctamente', async () => {
      const dto = {
        socio_id: 'u1', placa: 'XYZ-9999',
        marca: 'Kia', modelo: 'Rio', anio: 2022, color: 'Rojo',
      };
      const result = await service.createVehiculo(dto);
      expect(mockVehiculoRepo.create).toHaveBeenCalledWith(dto);
      expect(mockVehiculoRepo.save).toHaveBeenCalled();
    });
  });

  // ── findAll ──────────────────────────────────────────────────
  describe('findAll()', () => {
    it('retorna lista de vehículos con documentos_vencidos calculados', async () => {
      const result = await service.findAll({ activo: true });
      expect(result.data).toHaveLength(2);
      // v1 no tiene docs vencidos
      expect(result.data[0].documentos_vencidos).toBe(0);
      // v2 tiene 1 doc vencido (2020-01-01)
      expect(result.data[1].documentos_vencidos).toBe(1);
    });

    it('retorna total correcto', async () => {
      const result = await service.findAll({});
      expect(result.total).toBe(2);
    });
  });

  // ── findOne ──────────────────────────────────────────────────
  describe('findOne()', () => {
    it('retorna el vehículo si existe', async () => {
      mockVehiculoRepo.findOne.mockResolvedValue(mockVehiculos[0]);
      const result = await service.findOne('v1');
      expect(result.placa).toBe('ABC-1234');
    });

    it('lanza NotFoundException si no existe', async () => {
      mockVehiculoRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  // ── registrarMantenimiento ───────────────────────────────────
  describe('registrarMantenimiento()', () => {
    beforeEach(() => {
      mockVehiculoRepo.findOne.mockResolvedValue(mockVehiculos[0]);
    });

    it('crea el mantenimiento y actualiza km del vehículo', async () => {
      const dto = {
        tipo: TipoMantenimiento.ACEITE,
        descripcion: 'Cambio de aceite 5W30',
        km_actual: 50000,
        costo: 35,
        fecha: '2026-05-01',
      };
      await service.registrarMantenimiento('v1', dto);
      expect(mockMantRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ vehiculo_id: 'v1', km_proximo: 55000 }),
      );
      expect(mockVehiculoRepo.update).toHaveBeenCalledWith('v1', { km_actual: 50000 });
    });

    it('calcula km_proximo correctamente (+5000 km)', async () => {
      await service.registrarMantenimiento('v1', {
        tipo: TipoMantenimiento.ACEITE,
        km_actual: 48500,
      });
      expect(mockMantRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ km_proximo: 53500 }),
      );
    });

    it('no actualiza km si no se proporciona km_actual', async () => {
      await service.registrarMantenimiento('v1', {
        tipo: TipoMantenimiento.FRENOS,
        descripcion: 'Revisión de frenos',
      });
      expect(mockVehiculoRepo.update).not.toHaveBeenCalled();
    });
  });

  // ── historialMantenimiento ───────────────────────────────────
  describe('historialMantenimiento()', () => {
    it('retorna el historial del vehículo ordenado por fecha', async () => {
      const mantenimientos = [
        { id: 'm1', vehiculo_id: 'v1', tipo: TipoMantenimiento.ACEITE, created_at: new Date() },
        { id: 'm2', vehiculo_id: 'v1', tipo: TipoMantenimiento.FRENOS, created_at: new Date() },
      ];
      mockMantRepo.find.mockResolvedValue(mantenimientos);
      const result = await service.historialMantenimiento('v1');
      expect(result).toHaveLength(2);
      expect(mockMantRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { vehiculo_id: 'v1' } }),
      );
    });
  });
});
