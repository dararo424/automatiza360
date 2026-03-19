import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class ReferidosService {
  constructor(private readonly prisma: PrismaService) {}

  async getMiCodigo(tenantId: string) {
    let code = await this.prisma.referralCode.findUnique({ where: { tenantId } });
    if (!code) {
      code = await this.prisma.referralCode.create({
        data: { tenantId, code: nanoid(8).toUpperCase() },
      });
    }
    return code;
  }

  async getReferrals(tenantId: string) {
    const code = await this.prisma.referralCode.findUnique({
      where: { tenantId },
      include: {
        referrals: {
          include: { referralCode: { select: { code: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return code?.referrals ?? [];
  }

  async registrarReferido(code: string, referredTenantId: string) {
    const referralCode = await this.prisma.referralCode.findUnique({ where: { code } });
    if (!referralCode) return null;
    return this.prisma.referral.upsert({
      where: { referredTenantId },
      update: {},
      create: {
        referralCodeId: referralCode.id,
        referredTenantId,
        status: 'PENDING',
      },
    });
  }
}
