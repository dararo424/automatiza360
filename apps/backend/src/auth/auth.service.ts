import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, SubscriptionStatus, User, Tenant } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioProvisioningService } from '../twilio/twilio-provisioning.service';
import { LoginDto } from './dto/login.dto';
import { RegistroTenantDto } from './dto/registro-tenant.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twilioProvisioning: TwilioProvisioningService,
  ) {}

  async registrarTenant(dto: RegistroTenantDto) {
    const emailExistente = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (emailExistente) {
      throw new ConflictException('El correo ya está registrado');
    }

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

      return [newTenant, newOwner];
    });

    const provision = await this.twilioProvisioning.provisionNumber(
      tenant.id,
      slug,
      botEmail,
      botPassword,
    );

    const token = this.generarToken(owner);

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
    return this.prisma.user.findUnique({
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
            trialEndsAt: true,
          },
        },
      },
    });
  }

  private async generateUniqueSlug(businessName: string): Promise<string> {
    const base = businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'negocio';

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
    };
    return this.jwtService.sign(payload);
  }
}
