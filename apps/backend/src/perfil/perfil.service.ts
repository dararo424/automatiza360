import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarPagosConfigDto, ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

@Injectable()
export class PerfilService {
  constructor(private readonly prisma: PrismaService) {}

  async getPerfilPublico(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant || !tenant.active) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const result: Record<string, unknown> = {
      nombre: tenant.name,
      industria: tenant.industry,
      descripcion: tenant.descripcion,
      horario: tenant.horario,
      logoUrl: tenant.logoUrl,
      direccion: tenant.direccion,
      ciudad: tenant.ciudad,
      latitud: tenant.latitud,
      longitud: tenant.longitud,
      whatsappNumber: tenant.ownerPhone,
    };

    // For restaurants: today's active menu
    if (tenant.industry === 'RESTAURANT') {
      const today = new Date();
      const startOfDay = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const menuHoy = await this.prisma.menuDia.findFirst({
        where: {
          tenantId: tenant.id,
          activo: true,
          fecha: { gte: startOfDay, lt: endOfDay },
        },
        include: { platos: { where: { disponible: true } } },
        orderBy: { createdAt: 'desc' },
      });

      if (menuHoy) {
        result['menuHoy'] = {
          platos: menuHoy.platos.map((p) => ({
            nombre: p.name,
            descripcion: p.description,
            precio: p.price,
          })),
        };
      }
    }

    // For clinics/beauty: active services
    if (tenant.industry === 'CLINIC' || tenant.industry === 'BEAUTY') {
      const servicios = await this.prisma.service.findMany({
        where: { tenantId: tenant.id, active: true },
        orderBy: { name: 'asc' },
      });

      result['servicios'] = servicios.map((s) => ({
        nombre: s.name,
        descripcion: s.description,
        precio: s.price,
        duracion: s.duration,
      }));
    }

    return result;
  }

  async getMiPerfil(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
        descripcion: true,
        horario: true,
        logoUrl: true,
        direccion: true,
        ciudad: true,
        latitud: true,
        longitud: true,
        ownerPhone: true,
        botName: true,
        botTone: true,
        twilioNumber: true,
        subscriptionStatus: true,
      },
    });

    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async getOnboardingStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { onboardingStep: true, onboardingDone: true },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return { step: tenant.onboardingStep, done: tenant.onboardingDone };
  }

  async actualizarOnboarding(tenantId: string, step: number) {
    const done = step >= 5;
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { onboardingStep: step, onboardingDone: done },
      select: { onboardingStep: true, onboardingDone: true },
    });
  }

  async actualizarPerfil(tenantId: string, dto: ActualizarPerfilDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        descripcion: dto.descripcion,
        horario: dto.horario,
        logoUrl: dto.logoUrl,
        direccion: dto.direccion,
        ciudad: dto.ciudad,
        latitud: dto.latitud,
        longitud: dto.longitud,
        ownerPhone: dto.ownerPhone,
        botName: dto.botName,
        botTone: dto.botTone,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
        descripcion: true,
        horario: true,
        logoUrl: true,
        direccion: true,
        ciudad: true,
        latitud: true,
        longitud: true,
        botName: true,
        botTone: true,
      },
    });
  }

  async getWhatsappStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { twilioNumber: true, subscriptionStatus: true },
    });
    const env = process.env.TWILIO_ENV ?? 'sandbox';
    const sandboxNumber = process.env.TWILIO_SANDBOX_NUMBER ?? '+14155238886';
    const sandboxWord = process.env.TWILIO_SANDBOX_WORD ?? 'automatiza360';

    if (tenant.twilioNumber) {
      return {
        mode: 'PRODUCCION' as const,
        botNumber: tenant.twilioNumber,
        sandboxNumber: null,
        sandboxWord: null,
      };
    }

    return {
      mode: 'SANDBOX' as const,
      botNumber: null,
      sandboxNumber,
      sandboxWord,
      twilioEnv: env,
    };
  }

  async getPagosConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        paymentMode: true,
        paymentText: true,
        wompiPublicKey: true,
        wompiIntegritySecret: true,
      },
    });
    // Nunca devolver el secret completo, solo si está configurado
    return {
      paymentMode: tenant.paymentMode,
      paymentText: tenant.paymentText,
      wompiPublicKey: tenant.wompiPublicKey,
      wompiIntegritySecretConfigured: Boolean(tenant.wompiIntegritySecret),
    };
  }

  async actualizarPagosConfig(tenantId: string, dto: ActualizarPagosConfigDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.paymentMode !== undefined && { paymentMode: dto.paymentMode }),
        ...(dto.paymentText !== undefined && { paymentText: dto.paymentText }),
        ...(dto.wompiPublicKey !== undefined && { wompiPublicKey: dto.wompiPublicKey }),
        ...(dto.wompiIntegritySecret !== undefined && {
          wompiIntegritySecret: dto.wompiIntegritySecret,
        }),
      },
      select: {
        paymentMode: true,
        paymentText: true,
        wompiPublicKey: true,
      },
    });
  }
}
