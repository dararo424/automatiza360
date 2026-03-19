import { Injectable } from '@nestjs/common';
import { MessageDirection, Plan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IngestMessageDto } from './dto/ingest-message.dto';

const PLAN_LIMITS: Record<Plan, number> = {
  STARTER: 500,
  PRO: 2000,
  BUSINESS: Infinity,
};

@Injectable()
export class ConversacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async ingestMessage(tenantId: string, dto: IngestMessageDto) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const limit = PLAN_LIMITS[tenant.plan as Plan] ?? 500;

    // Upsert conversation
    const conversation = await this.prisma.conversation.upsert({
      where: { tenantId_clientPhone: { tenantId, clientPhone: dto.clientPhone } },
      update: {
        lastMessage: dto.body,
        lastMessageAt: new Date(),
        clientName: dto.clientName ?? undefined,
        unreadCount: dto.direction === MessageDirection.INBOUND
          ? { increment: 1 }
          : undefined,
      },
      create: {
        tenantId,
        clientPhone: dto.clientPhone,
        clientName: dto.clientName,
        lastMessage: dto.body,
        lastMessageAt: new Date(),
        unreadCount: dto.direction === MessageDirection.INBOUND ? 1 : 0,
      },
    });

    // Enforce plan limit (count inbound messages this month)
    if (dto.direction === MessageDirection.INBOUND) {
      if (tenant.conversationCountMonth >= limit) {
        return { blocked: true, reason: 'plan_limit_reached', conversationId: conversation.id };
      }
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { conversationCountMonth: { increment: 1 } },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        body: dto.body,
        direction: dto.direction,
      },
    });

    return { blocked: false, message, conversationId: conversation.id };
  }

  async listConversations(tenantId: string) {
    return this.prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { lastMessageAt: 'desc' },
      select: {
        id: true,
        clientPhone: true,
        clientName: true,
        lastMessage: true,
        lastMessageAt: true,
        unreadCount: true,
        _count: { select: { messages: true } },
      },
    });
  }

  async getConversation(tenantId: string, id: string) {
    return this.prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async markRead(tenantId: string, id: string) {
    return this.prisma.conversation.updateMany({
      where: { id, tenantId },
      data: { unreadCount: 0 },
    });
  }

  async getUsage(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: true, conversationCountMonth: true },
    });
    const limit = PLAN_LIMITS[tenant.plan as Plan] ?? 500;
    return {
      used: tenant.conversationCountMonth,
      limit: limit === Infinity ? null : limit,
      plan: tenant.plan,
    };
  }
}
