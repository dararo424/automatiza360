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
import { ProductosService } from './productos.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';

@UseGuards(JwtAuthGuard)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  crear(@Body() dto: CrearProductoDto, @CurrentUser() user: any) {
    return this.productosService.crear(dto, user.tenantId);
  }

  @Get()
  listar(@CurrentUser() user: any) {
    return this.productosService.listar(user.tenantId);
  }

  @Get(':id')
  buscarUno(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productosService.buscarUno(id, user.tenantId);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarProductoDto,
    @CurrentUser() user: any,
  ) {
    return this.productosService.actualizar(id, dto, user.tenantId);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productosService.eliminar(id, user.tenantId);
  }
}
