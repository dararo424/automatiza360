import { Injectable } from '@nestjs/common';
import { MessageDirection, Plan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { IngestMessageDto } from './dto/ingest-message.dto';

const PLAN_LIMITS: Record<Plan, number> = {
  STARTER: 500,
  PRO: 2000,
  BUSINESS: Infinity,
};

@Injectable()
export class ConversacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async checkAndTrackConversation(tenantId: string, clientPhone: string): Promise<{
    allowed: boolean;
    used: number;
    limit: number | null;
    plan: string;
  }> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: true, conversationCountMonth: true, subscriptionStatus: true },
    });
    const rawLimit = PLAN_LIMITS[tenant.plan as Plan] ?? 500;
    const limit = rawLimit === Infinity ? null : rawLimit;

    // Check if this phone already had a conversation THIS calendar month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const existing = await this.prisma.conversation.findUnique({
      where: { tenantId_clientPhone: { tenantId, clientPhone } },
      select: { lastMessageAt: true },
    });

    const alreadyCountedThisMonth =
      existing?.lastMessageAt != null && existing.lastMessageAt >= startOfMonth;

    if (alreadyCountedThisMonth) {
      return { allowed: true, used: tenant.conversationCountMonth, limit, plan: tenant.plan };
    }

    // New conversation this month — check limit
    if (limit !== null && tenant.conversationCountMonth >= limit) {
      return { allowed: false, used: tenant.conversationCountMonth, limit, plan: tenant.plan };
    }

    // Within limit — increment
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { conversationCountMonth: { increment: 1 } },
    });

    return { allowed: true, used: tenant.conversationCountMonth + 1, limit, plan: tenant.plan };
  }

  async ingestMessage(tenantId: string, dto: IngestMessageDto) {
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
        needsAttention: true,
        escalatedAt: true,
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

  async getSesion(tenantId: string, phone: string, limit = 10) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { tenantId, clientPhone: { contains: phone.replace('whatsapp:', '').trim() } },
    });
    if (!conversation) return [];

    const messages = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { body: true, direction: true, createdAt: true },
    });

    return messages.map((m) => ({
      role: m.direction === 'INBOUND' ? 'user' : 'assistant',
      content: m.body,
    }));
  }

  async escalarConversacionPorTelefono(tenantId: string, phone: string) {
    const clean = phone.replace('whatsapp:', '').trim();
    const conversation = await this.prisma.conversation.findFirst({
      where: { tenantId, clientPhone: { contains: clean } },
    });
    if (!conversation) {
      return { updated: false, reason: 'not_found' };
    }
    return this.escalarConversacion(tenantId, conversation.id);
  }

  async escalarConversacion(tenantId: string, id: string) {
    const updated = await this.prisma.conversation.updateMany({
      where: { id, tenantId },
      data: { needsAttention: true, escalatedAt: new Date() },
    });

    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
    });

    if (conversation) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          users: {
            where: { role: 'OWNER' },
            select: { email: true },
            take: 1,
          },
        },
      });

      const ownerEmail = tenant?.users[0]?.email;
      if (ownerEmail && tenant) {
        this.emailService
          .sendEscalacion(ownerEmail, {
            storeName: tenant.name,
            clientPhone: conversation.clientPhone,
            lastMessage: conversation.lastMessage ?? '',
          })
          .catch(() => {});
      }
    }

    return { updated, conversation };
  }
}
