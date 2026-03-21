import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SucursalesService } from './sucursales.service';
import { CrearSucursalDto } from './dto/crear-sucursal.dto';

@Controller('sucursales')
@UseGuards(JwtAuthGuard)
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Get()
  findAll(@CurrentUser() user: { tenantId: string }) {
    return this.sucursalesService.findAll(user.tenantId);
  }

  @Post()
  create(
    @CurrentUser() user: { tenantId: string; role: string },
    @Body() dto: CrearSucursalDto,
  ) {
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Sin permisos para crear sucursales');
    }
    return this.sucursalesService.create(user.tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { tenantId: string; role: string },
    @Param('id') id: string,
    @Body() dto: CrearSucursalDto,
  ) {
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Sin permisos para editar sucursales');
    }
    return this.sucursalesService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { tenantId: string; role: string },
    @Param('id') id: string,
  ) {
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Sin permisos para eliminar sucursales');
    }
    return this.sucursalesService.remove(user.tenantId, id);
  }
}
