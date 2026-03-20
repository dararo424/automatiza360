import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GarantiasService } from './garantias.service';
import { CrearGarantiaDto } from './dto/crear-garantia.dto';

@Controller('garantias')
@UseGuards(JwtAuthGuard)
export class GarantiasController {
  constructor(private readonly svc: GarantiasService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.svc.findAll(user.tenantId);
  }

  @Get('alertas')
  getAlertas(@CurrentUser() user: any) {
    return this.svc.getAlertas(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CrearGarantiaDto) {
    return this.svc.create(user.tenantId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.remove(user.tenantId, id);
  }
}
