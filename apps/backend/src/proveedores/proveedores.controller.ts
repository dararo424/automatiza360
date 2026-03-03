import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProveedoresService } from './proveedores.service';
import { ImportarCatalogoDto } from './dto/importar-catalogo.dto';
import { BuscarProductosDto } from './dto/buscar-productos.dto';

@UseGuards(JwtAuthGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post('importar')
  importarCatalogo(@Body() dto: ImportarCatalogoDto, @CurrentUser() user: any) {
    return this.proveedoresService.importarCatalogo(dto, user.tenantId);
  }

  @Get()
  listar(@CurrentUser() user: any) {
    return this.proveedoresService.listar(user.tenantId);
  }

  @Get('buscar')
  buscarProductos(@Query() query: BuscarProductosDto, @CurrentUser() user: any) {
    return this.proveedoresService.buscarProductos(query.q ?? '', user.tenantId);
  }

  @Get(':id/productos')
  listarProductos(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proveedoresService.listarProductos(id, user.tenantId);
  }
}
