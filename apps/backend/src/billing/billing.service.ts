import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async registrarPago(
    tenantId: string,
    monto: number,
    plan: string,
    wompiRef?: string,
    wompiId?: string,
    status: string = 'COMPLETADO',
    descripcion?: string,
  ) {
    return this.prisma.pagoRegistro.create({
      data: {
        tenantId,
        monto,
        plan,
        status,
        wompiRef,
        wompiId,
        descripcion,
      },
    });
  }

  async getPagos(tenantId: string) {
    return this.prisma.pagoRegistro.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
