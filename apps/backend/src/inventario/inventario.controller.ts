import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InventarioService } from './inventario.service';
import { AjustarStockDto } from './dto/ajustar-stock.dto';

@UseGuards(JwtAuthGuard)
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('alertas')
  listarAlertas(@CurrentUser() user: any) {
    return this.inventarioService.listarAlertas(user.tenantId);
  }

  @Patch(':id/ajustar-stock')
  ajustarStock(
    @Param('id') id: string,
    @Body() dto: AjustarStockDto,
    @CurrentUser() user: any,
  ) {
    return this.inventarioService.ajustarStock(id, dto, user.tenantId);
  }
}
