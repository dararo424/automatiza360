import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ComprasService } from './compras.service';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { CrearOrdenCompraDto } from './dto/crear-orden-compra.dto';

@UseGuards(JwtAuthGuard)
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  // ─── Proveedores ─────────────────────────────────────────────────────────

  @Get('proveedores')
  listarProveedores(@CurrentUser() user: any) {
    return this.comprasService.listarProveedores(user.tenantId);
  }

  @Post('proveedores')
  crearProveedor(@Body() dto: CrearProveedorDto, @CurrentUser() user: any) {
    return this.comprasService.crearProveedor(user.tenantId, dto);
  }

  @Patch('proveedores/:id')
  actualizarProveedor(
    @Param('id') id: string,
    @Body() dto: Partial<CrearProveedorDto>,
    @CurrentUser() user: any,
  ) {
    return this.comprasService.actualizarProveedor(id, user.tenantId, dto);
  }

  @Delete('proveedores/:id')
  eliminarProveedor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.comprasService.eliminarProveedor(id, user.tenantId);
  }

  // ─── Órdenes de compra ───────────────────────────────────────────────────

  @Get('ordenes')
  listarOrdenes(@CurrentUser() user: any) {
    return this.comprasService.listarOrdenes(user.tenantId);
  }

  @Post('ordenes')
  crearOrden(@Body() dto: CrearOrdenCompraDto, @CurrentUser() user: any) {
    return this.comprasService.crearOrden(user.tenantId, dto);
  }

  @Patch('ordenes/:id/recibir')
  recibirOrden(@Param('id') id: string, @CurrentUser() user: any) {
    return this.comprasService.recibirOrden(id, user.tenantId);
  }
}
