import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Industry, Role, SubscriptionStatus, User, Tenant } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TwilioProvisioningService } from '../twilio/twilio-provisioning.service';
import { LoginDto } from './dto/login.dto';
import { RegistroTenantDto } from './dto/registro-tenant.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twilioProvisioning: TwilioProvisioningService,
    private readonly emailService: EmailService,
  ) {}

  async registrarTenant(dto: RegistroTenantDto) {
    // IMPORTANTE: el bot-staff y el owner DEBEN estar en el mismo tenantId.
    // Nunca crear un tenant separado para el bot y otro para el owner.

    const emailExistente = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (emailExistente) {
      throw new ConflictException('El correo ya está registrado');
    }

    const slugBase = this.buildSlugBase(dto.businessName);

    // Si ya existe un tenant con ese slug sin OWNER, agregar el owner ahí
    // (evita crear un tenant duplicado cuando el negocio fue pre-registrado via seed)
    const tenantExistente = await this.prisma.tenant.findUnique({
      where: { slug: slugBase },
      include: { users: { where: { role: Role.OWNER } } },
    });

    if (tenantExistente && tenantExistente.users.length === 0) {
      return this.agregarOwnerATenantExistente(dto, tenantExistente);
    }

    // Flujo normal: crear tenant nuevo con owner + bot en la misma transacción
    const slug = await this.generateUniqueSlug(dto.businessName);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const botPassword = crypto.randomBytes(16).toString('hex');
    const botPasswordHash = await bcrypt.hash(botPassword, 10);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const botEmail = `bot@${slug}.automatiza360.com`;

    const [tenant, owner] = await this.prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: dto.businessName,
          slug,
          industry: dto.industry,
          trialEndsAt,
          subscriptionStatus: SubscriptionStatus.TRIAL,
          ownerPhone: dto.ownerPhone,
        },
      });

      const newOwner = await tx.user.create({
        data: {
          name: dto.ownerName,
          email: dto.email,
          password: passwordHash,
          role: Role.OWNER,
          tenantId: newTenant.id,
        },
      });

      await tx.user.create({
        data: {
          name: 'Bot',
          email: botEmail,
          password: botPasswordHash,
          role: Role.STAFF,
          tenantId: newTenant.id,
        },
      });

      // Datos default por industry (servicios + profesional de ejemplo)
      await this.crearDatosDefault(tx, newTenant.id, dto.industry);

      return [newTenant, newOwner];
    });

    const provision = await this.twilioProvisioning.provisionNumber(
      tenant.id,
      slug,
      botEmail,
      botPassword,
    );

    const token = this.generarToken(owner);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await this.emailService.enviarBienvenida(
      dto.email,
      dto.ownerName,
      dto.businessName,
      `${frontendUrl}/login`,
    );

    return {
      mensaje: 'Tenant registrado exitosamente',
      token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        industry: tenant.industry,
      },
      trialEndsAt: trialEndsAt.toISOString(),
      setupInstructions: provision.setupInstructions,
      sandboxMode: provision.sandboxMode,
      sandboxWord: provision.sandboxWord,
      twilioNumber: provision.twilioNumber,
    };
  }

  private async agregarOwnerATenantExistente(
    dto: RegistroTenantDto,
    tenant: Tenant,
  ) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const owner = await this.prisma.user.create({
      data: {
        name: dto.ownerName,
        email: dto.email,
        password: passwordHash,
        role: Role.OWNER,
        tenantId: tenant.id,
      },
    });

    // Actualizar ownerPhone si no estaba registrado
    if (!tenant.ownerPhone && dto.ownerPhone) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { ownerPhone: dto.ownerPhone },
      });
    }

    const token = this.generarToken(owner);

    // El bot ya existe; provisionamos Twilio solo si no tiene número asignado
    const botUser = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, role: Role.STAFF },
    });

    let provision = {
      setupInstructions: 'WhatsApp ya configurado para este negocio.',
      sandboxMode: true,
      sandboxWord: '',
      twilioNumber: tenant.twilioNumber ?? '',
    };

    if (!tenant.twilioNumber && botUser) {
      const botPassword = crypto.randomBytes(16).toString('hex');
      const botPasswordHash = await bcrypt.hash(botPassword, 10);
      await this.prisma.user.update({
        where: { id: botUser.id },
        data: { password: botPasswordHash },
      });
      const p = await this.twilioProvisioning.provisionNumber(
        tenant.id,
        tenant.slug,
        botUser.email,
        botPassword,
      );
      provision = {
        setupInstructions: p.setupInstructions,
        sandboxMode: p.sandboxMode,
        sandboxWord: p.sandboxWord ?? '',
        twilioNumber: p.twilioNumber ?? '',
      };
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await this.emailService.enviarBienvenida(
      dto.email,
      dto.ownerName,
      dto.businessName,
      `${frontendUrl}/login`,
    );

    return {
      mensaje: 'Cuenta creada para negocio existente',
      token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        industry: tenant.industry,
      },
      trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
      setupInstructions: provision.setupInstructions,
      sandboxMode: provision.sandboxMode,
      sandboxWord: provision.sandboxWord,
      twilioNumber: provision.twilioNumber,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(dto.password, user.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.active) {
      throw new ForbiddenException('El usuario está inactivo');
    }

    if (!user.tenant.active) {
      throw new ForbiddenException('El negocio está inactivo');
    }

    const token = this.generarToken(user);

    return {
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: user.id,
        nombre: user.name,
        email: user.email,
        rol: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async getPerfil(userId: string) {
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        tenantId: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            industry: true,
            active: true,
            subscriptionStatus: true,
            subscriptionPlan: true,
            subscriptionEndsAt: true,
            trialEndsAt: true,
          },
        },
      },
    });

    if (!usuario) return null;

    return {
      ...usuario,
      tenant: {
        ...usuario.tenant,
        // subscriptionPlan toma precedencia sobre plan si existe
        plan: usuario.tenant!.subscriptionPlan ?? usuario.tenant!.plan,
        subscriptionStatus: usuario.tenant!.subscriptionStatus,
        subscriptionPlan: usuario.tenant!.subscriptionPlan,
      },
    };
  }

  async solicitarRecuperacion(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Siempre responder igual para no revelar si el email existe
    if (!user || !user.active) {
      return { message: 'Si el correo existe, recibirás un enlace en breve.' };
    }

    // Invalidar tokens anteriores
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await this.emailService.enviarRecuperacionContrasena(user.email, user.name, resetUrl);

    return { message: 'Si el correo existe, recibirás un enlace en breve.' };
  }

  async resetearContrasena(token: string, nuevaContrasena: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('El enlace es inválido o ha expirado.');
    }

    const hash = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar contraseña e invalidar sesiones activas (tokenVersion)
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hash, tokenVersion: { increment: 1 } },
    });

    // Marcar token como usado para que no pueda reutilizarse
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return { message: 'Contraseña actualizada correctamente.' };
  }

  private buildSlugBase(businessName: string): string {
    return (
      businessName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'negocio'
    );
  }

  private async generateUniqueSlug(businessName: string): Promise<string> {
    const base = this.buildSlugBase(businessName);
    const existing = await this.prisma.tenant.findUnique({ where: { slug: base } });
    if (!existing) return base;

    const suffix = crypto.randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
  }

  private generarToken(user: User & { tenant?: Tenant }) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      tv: user.tokenVersion,
    };
    return this.jwtService.sign(payload);
  }

  /** Crea servicios y un profesional de ejemplo según el industry del negocio. */
  private async crearDatosDefault(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    tenantId: string,
    industry: Industry,
  ): Promise<void> {
    if (industry === Industry.CLINIC) {
      await tx.service.createMany({
        data: [
          { name: 'Consulta General', description: 'Medicina general', duration: 45, price: 50000, tenantId },
          { name: 'Consulta Pediatría', description: 'Pediatría', duration: 45, price: 60000, tenantId },
          { name: 'Toma de Muestras', description: 'Laboratorio clínico', duration: 20, price: 30000, tenantId },
          { name: 'Electrocardiograma', description: 'ECG de 12 derivaciones', duration: 30, price: 80000, tenantId },
        ],
      });
      const medico = await tx.professional.create({
        data: { name: 'Médico General', specialty: 'Medicina General', tenantId },
      });
      // Horario L-V 8:00-17:00
      await tx.schedule.createMany({
        data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          dayOfWeek, startTime: '08:00', endTime: '17:00', professionalId: medico.id,
        })),
      });
    }

    if (industry === Industry.BEAUTY) {
      await tx.service.createMany({
        data: [
          { name: 'Corte de cabello', description: 'Corte + lavado + secado', duration: 45, price: 45000, tenantId },
          { name: 'Tinte completo', description: 'Coloración + tratamiento', duration: 120, price: 120000, tenantId },
          { name: 'Manicure', description: 'Esmaltado tradicional o semipermanente', duration: 45, price: 30000, tenantId },
          { name: 'Pedicure', description: 'Pedicure completo con esmaltado', duration: 60, price: 35000, tenantId },
          { name: 'Facial básico', description: 'Limpieza facial e hidratación', duration: 60, price: 80000, tenantId },
          { name: 'Depilación de cejas', description: 'Diseño y depilación', duration: 20, price: 15000, tenantId },
        ],
      });
      const estilista = await tx.professional.create({
        data: { name: 'Estilista', specialty: 'Colorimetría', tenantId },
      });
      // Horario L-S 9:00-18:00
      await tx.schedule.createMany({
        data: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek, startTime: '09:00', endTime: '18:00', professionalId: estilista.id,
        })),
      });
    }

    if (industry === Industry.RESTAURANT) {
      await tx.product.createMany({
        data: [
          { name: 'Plato del día', description: 'Consultar disponibilidad', price: 15000, stock: 50, minStock: 5, tenantId },
          { name: 'Bebida', description: 'Gaseosa, jugo o agua', price: 3000, stock: 100, minStock: 10, tenantId },
        ],
      });
    }

    if (industry === Industry.TECH_STORE) {
      await tx.product.createMany({
        data: [
          { name: 'Servicio técnico general', description: 'Diagnóstico y reparación', price: 50000, stock: 999, minStock: 0, tenantId },
        ],
      });
    }
  }
}
