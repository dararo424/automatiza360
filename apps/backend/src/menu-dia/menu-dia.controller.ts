import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MenuDiaService } from './menu-dia.service';
import { CrearMenuDiaDto } from './dto/crear-menu-dia.dto';

@Controller('menu-dia')
export class MenuDiaController {
  constructor(private readonly menuDiaService: MenuDiaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('qr-config')
  qrConfig(@CurrentUser() user: any) {
    return this.menuDiaService.getQrConfigByTenantId(user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  crearOActualizarHoy(@Body() dto: CrearMenuDiaDto, @CurrentUser() user: any) {
    return this.menuDiaService.crearOActualizarHoy(dto, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hoy')
  obtenerHoy(@CurrentUser() user: any) {
    return this.menuDiaService.obtenerHoy(user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listar(@CurrentUser() user: any) {
    return this.menuDiaService.listar(user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle')
  toggleActivo(@Param('id') id: string, @CurrentUser() user: any) {
    return this.menuDiaService.toggleActivo(id, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  eliminar(@Param('id') id: string, @CurrentUser() user: any) {
    return this.menuDiaService.eliminar(id, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('plato/:platoId/toggle')
  togglePlato(@Param('platoId') platoId: string) {
    return this.menuDiaService.togglePlato(platoId);
  }
}
