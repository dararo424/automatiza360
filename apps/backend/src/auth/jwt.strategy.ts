import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  tv?: number; // tokenVersion — invalida tokens anteriores al cambio de contraseña
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('No autorizado');
    }

    // Verificar tokenVersion: si el token no tiene tv (antiguo) o no coincide, rechazar.
    // Esto fuerza re-login tras cambio de contraseña o tokens pre-feature.
    if (payload.tv === undefined || payload.tv !== user.tokenVersion) {
      throw new UnauthorizedException('Sesión expirada. Inicia sesión de nuevo.');
    }

    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
  }
}
