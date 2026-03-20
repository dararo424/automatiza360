import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { MenuDiaService } from './menu-dia.service';

@Controller('menu-publico')
export class MenuPublicoController {
  constructor(private readonly menuDiaService: MenuDiaService) {}

  @Get(':tenantSlug')
  async obtenerMenuPublico(@Param('tenantSlug') tenantSlug: string) {
    const result = await this.menuDiaService.obtenerMenuPublico(tenantSlug);
    if (!result) throw new NotFoundException('Restaurante no encontrado');
    return result;
  }
}
