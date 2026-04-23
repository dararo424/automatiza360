import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Plan, Role } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { InvitarUsuarioDto } from './dto/invitar-usuario.dto';

const AGENT_LIMITS: Record<Plan, number> = {
  STARTER: 1,
  PRO: 3,
  BUSINESS: Infinity,
};

class CambiarRolDto {
  @IsEnum(Role)
  role: Role;
}

@Controller('equipo')
@UseGuards(JwtAuthGuard)
export class EquipoController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listar(@CurrentUser() user: any) {
    return this.prisma.user.findMany({
      where: { tenantId: user.tenantId, active: true },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post('invitar')
  async invitar(@CurrentUser() user: any, @Body() dto: InvitarUsuarioDto) {
    if (user.role !== Role.OWNER && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo OWNER o ADMIN pueden invitar usuarios');
    }

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: user.tenantId },
      select: { plan: true },
    });

    const maxAgentes = AGENT_LIMITS[tenant.plan as Plan] ?? 1;
    if (maxAgentes !== Infinity) {
      const actuales = await this.prisma.user.count({
        where: { tenantId: user.tenantId, active: true },
      });
      if (actuales >= maxAgentes + 1) {
        throw new ForbiddenException(
          `Tu plan ${tenant.plan} permite máximo ${maxAgentes} agente${maxAgentes !== 1 ? 's' : ''}. Actualiza tu plan para agregar más.`,
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        tenantId: user.tenantId,
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        role: dto.role === Role.OWNER ? Role.ADMIN : dto.role,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  @Patch(':id/rol')
  async cambiarRol(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CambiarRolDto,
  ) {
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException('Solo el OWNER puede cambiar roles');
    }
    return this.prisma.user.updateMany({
      where: { id, tenantId: user.tenantId },
      data: { role: dto.role },
    });
  }

  @Delete(':id')
  async eliminar(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== Role.OWNER && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Sin permisos para eliminar usuarios');
    }
    return this.prisma.user.updateMany({
      where: { id, tenantId: user.tenantId },
      data: { active: false },
    });
  }
}
