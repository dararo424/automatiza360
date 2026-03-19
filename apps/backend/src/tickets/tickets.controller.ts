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
import { TicketStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { CrearTicketDto } from './dto/crear-ticket.dto';
import { ActualizarTicketDto } from './dto/actualizar-ticket.dto';
import { ActualizarEstadoTicketDto } from './dto/actualizar-estado-ticket.dto';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  crear(@Body() dto: CrearTicketDto, @CurrentUser() user: any) {
    return this.ticketsService.crear(dto, user.tenantId);
  }

  @Get('exportar')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="tickets.csv"')
  async exportar(@CurrentUser() user: any, @Res({ passthrough: false }) res: Response) {
    const csv = await this.ticketsService.exportarCsv(user.tenantId);
    res.send(csv);
  }

  @Get()
  listar(
    @CurrentUser() user: any,
    @Query('estado') estado?: TicketStatus,
  ) {
    return this.ticketsService.listar(user.tenantId, estado);
  }

  @Get(':id')
  buscarUno(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketsService.buscarUno(id, user.tenantId);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.actualizar(id, dto, user.tenantId);
  }

  @Patch(':id/estado')
  actualizarEstado(
    @Param('id') id: string,
    @Body() dto: ActualizarEstadoTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.actualizarEstado(id, dto, user.tenantId);
  }
}
