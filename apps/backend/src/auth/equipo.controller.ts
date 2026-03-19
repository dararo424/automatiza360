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
import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { InvitarUsuarioDto } from './dto/invitar-usuario.dto';

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
