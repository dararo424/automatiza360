import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface Flujo {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  industrias: string[];
}

export const FLUJOS_DISPONIBLES: Flujo[] = [
  { id: 'ventas', nombre: 'Ventas y Pedidos', descripcion: 'Bot toma pedidos y órdenes por WhatsApp', emoji: '🛒', industrias: ['RESTAURANT', 'TECH_STORE', 'CLOTHING_STORE', 'PHARMACY', 'BAKERY', 'OTHER'] },
  { id: 'citas', nombre: 'Reserva de Citas', descripcion: 'Agenda citas y gestiona disponibilidad', emoji: '📅', industrias: ['CLINIC', 'BEAUTY', 'GYM', 'VETERINARY', 'HOTEL', 'OTHER'] },
  { id: 'soporte', nombre: 'Soporte y Tickets', descripcion: 'Gestión de reparaciones y soporte técnico', emoji: '🔧', industrias: ['TECH_STORE', 'WORKSHOP', 'OTHER'] },
  { id: 'catalogo', nombre: 'Catálogo e Inventario', descripcion: 'Consulta de productos, precios y stock', emoji: '📦', industrias: ['ALL'] },
  { id: 'campanas', nombre: 'Campañas y Promociones', descripcion: 'Envío masivo de mensajes y cupones', emoji: '📣', industrias: ['ALL'] },
  { id: 'pagos', nombre: 'Cobros por WhatsApp', descripcion: 'Links de pago Wompi enviados por el bot', emoji: '💳', industrias: ['ALL'] },
];

const PLAN_LIMITE: Record<Plan, number> = {
  STARTER: 2,
  PRO: 4,
  BUSINESS: 6,
};

@Injectable()
export class FlujoService {
  constructor(private readonly prisma: PrismaService) {}

  async getFlujos(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: true, flujosActivos: true },
    });

    const planKey = tenant.plan as Plan;
    const limite = PLAN_LIMITE[planKey] ?? 2;
    const activos = tenant.flujosActivos
      ? tenant.flujosActivos.split(',').filter(Boolean)
      : [];

    return {
      disponibles: FLUJOS_DISPONIBLES,
      activos,
      limite,
      plan: planKey,
    };
  }

  async updateFlujos(tenantId: string, flujos: string[]) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: true },
    });

    const planKey = tenant.plan as Plan;
    const limite = PLAN_LIMITE[planKey] ?? 2;

    if (flujos.length > limite) {
      throw new BadRequestException(
        `Tu plan ${planKey} permite máximo ${limite} flujos activos`,
      );
    }

    // Validate all flujo ids exist
    const validIds = FLUJOS_DISPONIBLES.map((f) => f.id);
    for (const id of flujos) {
      if (!validIds.includes(id)) {
        throw new BadRequestException(`Flujo desconocido: ${id}`);
      }
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { flujosActivos: flujos.join(',') },
    });

    return { activos: flujos, limite, plan: planKey };
  }

  async assertFlujoActivo(tenantId: string, flujoId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { flujosActivos: true },
    });
    const activos = tenant.flujosActivos
      ? tenant.flujosActivos.split(',').filter(Boolean)
      : [];
    if (!activos.includes(flujoId)) {
      throw new ForbiddenException(
        `El flujo "${flujoId}" no está activo en tu plan. Actívalo en /mi-plan.`,
      );
    }
  }
}
