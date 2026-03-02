import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User, Tenant } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegistroTenantDto } from './dto/registro-tenant.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registrarTenant(dto: RegistroTenantDto) {
    const slugExistente = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });
    if (slugExistente) {
      throw new ConflictException('El slug ya está en uso');
    }

    const emailExistente = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (emailExistente) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [_tenant, user] = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug: dto.tenantSlug,
          industry: dto.industry,
        },
      });

      const owner = await tx.user.create({
        data: {
          name: dto.ownerName,
          email: dto.email,
          password: passwordHash,
          role: Role.OWNER,
          tenantId: tenant.id,
        },
      });

      return [tenant, owner];
    });

    const token = this.generarToken(user);

    return {
      mensaje: 'Tenant registrado exitosamente',
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
          },
        },
      },
    });
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
