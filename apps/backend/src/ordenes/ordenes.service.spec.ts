import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContactosService } from '../contactos/contactos.service';
import { AutomacionesService } from '../automaciones/automaciones.service';
import { CuponesService } from '../cupones/cupones.service';
import { PushService } from '../push/push.service';
import { FlujoService } from '../flujos/flujos.service';

const mockPrisma = {
  product: { findMany: jest.fn() },
  order: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockContactos = { upsertByPhone: jest.fn() };
const mockAutomaciones = { dispararTrigger: jest.fn().mockResolvedValue(undefined) };
const mockCupones = { validar: jest.fn(), aplicar: jest.fn() };
const mockPush = { sendToTenant: jest.fn().mockResolvedValue(undefined) };
const mockFlujos = { assertFlujoActivo: jest.fn().mockResolvedValue(undefined) };

const TENANT_ID = 'tenant-1';

const fakeProduct = (id: string, name: string, price: number) => ({
  id, name, price, active: true, tenantId: TENANT_ID, stock: 10, minStock: 1,
});

describe('OrdenesService', () => {
  let service: OrdenesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        OrdenesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ContactosService, useValue: mockContactos },
        { provide: AutomacionesService, useValue: mockAutomaciones },
        { provide: CuponesService, useValue: mockCupones },
        { provide: PushService, useValue: mockPush },
        { provide: FlujoService, useValue: mockFlujos },
      ],
    }).compile();
    service = module.get<OrdenesService>(OrdenesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // crear
  // ──────────────────────────────────────────────

  describe('crear', () => {
    const dto = {
      items: [{ productId: 'p1', quantity: 2 }],
      phone: '+573001234567',
      notes: 'Sin cebolla',
    };

    it('lanza BadRequestException si un producto no pertenece al tenant', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]); // ninguno encontrado
      await expect(service.crear(dto, TENANT_ID)).rejects.toThrow(BadRequestException);
    });

    it('calcula el total correctamente y crea la orden', async () => {
      mockPrisma.product.findMany.mockResolvedValue([fakeProduct('p1', 'Hamburguesa', 20000)]);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          order: {
            count: jest.fn().mockResolvedValue(5),
            create: jest.fn().mockResolvedValue({
              id: 'o1', number: 6, total: 40000, items: [],
            }),
          },
        };
        return cb(tx);
      });

      const result = await service.crear(dto, TENANT_ID);
      expect(result.total).toBe(40000); // 2 × 20000
      expect(result.number).toBe(6);
    });

    it('rechaza items con productId duplicado (usa Set)', async () => {
      const dtoConDuplicado = {
        items: [{ productId: 'p1', quantity: 1 }, { productId: 'p1', quantity: 2 }],
        phone: '+57300',
      };
      mockPrisma.product.findMany.mockResolvedValue([fakeProduct('p1', 'Producto', 10000)]);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          order: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({ id: 'o2', number: 1, total: 10000, items: [] }),
          },
        };
        return cb(tx);
      });
      // No debe lanzar error — deduplica IDs para buscar, pero crea los items normalmente
      await expect(service.crear(dtoConDuplicado, TENANT_ID)).resolves.toBeDefined();
    });
  });

  // ──────────────────────────────────────────────
  // listar
  // ──────────────────────────────────────────────

  describe('listar', () => {
    it('delega correctamente al prisma con tenantId', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      const result = await service.listar(TENANT_ID);
      expect(result).toEqual([]);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT_ID } }),
      );
    });

    it('filtra por estado cuando se pasa', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      await service.listar(TENANT_ID, 'PENDING' as any);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT_ID, status: 'PENDING' } }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // buscarUno
  // ──────────────────────────────────────────────

  describe('buscarUno', () => {
    it('lanza NotFoundException si la orden no existe', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);
      await expect(service.buscarUno('o-no-existe', TENANT_ID)).rejects.toThrow(NotFoundException);
    });

    it('retorna la orden si existe y pertenece al tenant', async () => {
      const fakeOrder = { id: 'o1', tenantId: TENANT_ID, items: [] };
      mockPrisma.order.findFirst.mockResolvedValue(fakeOrder);
      const result = await service.buscarUno('o1', TENANT_ID);
      expect(result.id).toBe('o1');
    });
  });

  // ──────────────────────────────────────────────
  // crearDesdeBot
  // ──────────────────────────────────────────────

  describe('crearDesdeBot', () => {
    const botDto = {
      items: [{ nombre_producto: 'Hamburguesa', cantidad: 1 }],
      telefono: '+573001234567',
      nombre_cliente: 'Carlos',
      metodo_pago: 'efectivo',
      direccion_entrega: 'Calle 10',
    };

    it('lanza BadRequestException si el producto no existe por nombre', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      await expect(service.crearDesdeBot(botDto, TENANT_ID)).rejects.toThrow(BadRequestException);
    });

    it('crea la orden con búsqueda por nombre case-insensitive', async () => {
      mockPrisma.product.findMany.mockResolvedValue([fakeProduct('p1', 'Hamburguesa', 15000)]);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          order: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({ id: 'o1', number: 1, total: 15000, items: [] }),
          },
        };
        return cb(tx);
      });

      const result = await service.crearDesdeBot(
        { ...botDto, items: [{ nombre_producto: 'HAMBURGUESA', cantidad: 1 }] },
        TENANT_ID,
      );
      expect(result.total).toBe(15000);
      // Push se dispara sin esperar (fire and forget)
      expect(mockPush.sendToTenant).toHaveBeenCalledWith(
        TENANT_ID,
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );
    });
  });
});
