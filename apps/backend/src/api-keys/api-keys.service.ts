import { ForbiddenException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        active: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateApiKeyDto) {
    // Only BUSINESS plan can have API keys
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: true },
    });
    if (tenant.plan !== 'BUSINESS') {
      throw new ForbiddenException('Las API keys solo están disponibles en el plan BUSINESS');
    }

    const rawKey = `a360_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = await this.prisma.apiKey.create({
      data: { tenantId, name: dto.name, keyHash, keyPrefix },
    });

    return { ...apiKey, rawKey };
  }

  async revoke(tenantId: string, id: string) {
    return this.prisma.apiKey.updateMany({
      where: { id, tenantId },
      data: { active: false },
    });
  }
}
