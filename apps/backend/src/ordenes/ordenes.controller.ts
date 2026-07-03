import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrderStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrdenesService } from './ordenes.service';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { CrearOrdenBotDto } from './dto/crear-orden-bot.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';

@ApiTags('ordenes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ordenes')
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

  @Post()
  crear(@Body() dto: CrearOrdenDto, @CurrentUser() user: any) {
    return this.ordenesService.crear(dto, user.tenantId);
  }

  @Post('bot')
  crearDesdeBot(@Body() dto: CrearOrdenBotDto, @CurrentUser() user: any) {
    return this.ordenesService.crearDesdeBot(dto, user.tenantId);
  }

  @Get('exportar')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="ordenes.csv"')
  async exportar(@CurrentUser() user: any, @Res({ passthrough: false }) res: Response) {
    const csv = await this.ordenesService.exportarCsv(user.tenantId);
    res.send(csv);
  }

  @Get()
  listar(
    @CurrentUser() user: any,
    @Query('estado') estado?: OrderStatus,
  ) {
    return this.ordenesService.listar(user.tenantId, estado);
  }

  @Get(':id/link-pago')
  generarLinkPago(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordenesService.generarLinkPago(user.tenantId, id);
  }

  @Post(':id/enviar-link-pago')
  enviarLinkPagoWhatsApp(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordenesService.enviarLinkPagoWhatsApp(user.tenantId, id);
  }

  @Get(':id')
  buscarUno(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordenesService.buscarUno(id, user.tenantId);
  }

  @Patch(':id/estado')
  actualizarEstado(
    @Param('id') id: string,
    @Body() dto: ActualizarEstadoDto,
    @CurrentUser() user: any,
  ) {
    return this.ordenesService.actualizarEstado(id, dto, user.tenantId);
  }
}
