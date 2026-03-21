import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CajaService {
  constructor(private readonly prisma: PrismaService) {}

  async getCorteDiario(tenantId: string, fecha?: string) {
    const fechaObj = fecha ? new Date(fecha) : new Date();
    const startOfDay = new Date(
      Date.UTC(fechaObj.getUTCFullYear(), fechaObj.getUTCMonth(), fechaObj.getUTCDate()),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [ordenes, gastos] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          tenantId,
          createdAt: { gte: startOfDay, lt: endOfDay },
          status: { not: OrderStatus.CANCELLED },
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.gasto.findMany({
        where: {
          tenantId,
          fecha: { gte: startOfDay, lt: endOfDay },
        },
      }),
    ]);

    const totalIngresos = ordenes.reduce((sum, o) => sum + o.total, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

    // Group by status (proxy for payment method since no dedicated field)
    const porEstado: Record<string, { metodo: string; total: number; count: number }> = {};
    for (const orden of ordenes) {
      const key = orden.status;
      if (!porEstado[key]) {
        porEstado[key] = { metodo: key, total: 0, count: 0 };
      }
      porEstado[key].total += orden.total;
      porEstado[key].count += 1;
    }

    return {
      fecha: startOfDay.toISOString().substring(0, 10),
      totalOrdenes: ordenes.length,
      totalIngresos,
      totalGastos,
      ganancia: totalIngresos - totalGastos,
      porMetodoPago: Object.values(porEstado),
      ordenes,
      gastos,
    };
  }
}
