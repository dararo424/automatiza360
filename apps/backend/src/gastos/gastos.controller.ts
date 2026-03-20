import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GastosService } from './gastos.service';
import { CrearGastoDto } from './dto/crear-gasto.dto';

@Controller('gastos')
@UseGuards(JwtAuthGuard)
export class GastosController {
  constructor(private readonly svc: GastosService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.svc.findAll(user.tenantId);
  }

  @Get('resumen')
  getResumen(@CurrentUser() user: any) {
    return this.svc.getResumen(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CrearGastoDto) {
    return this.svc.create(user.tenantId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.remove(user.tenantId, id);
  }
}
