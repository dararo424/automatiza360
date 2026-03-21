import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Put,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CitasService } from './citas.service';
import { CrearCitaBotDto } from './dto/crear-cita-bot.dto';
import { CancelarCitaDto } from './dto/cancelar-cita.dto';
import { ActualizarEstadoCitaDto } from './dto/actualizar-estado-cita.dto';

@ApiTags('citas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Get('exportar')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="citas.csv"')
  async exportar(@CurrentUser() user: any, @Res({ passthrough: false }) res: Response) {
    const csv = await this.citasService.exportarCsv(user.tenantId);
    res.send(csv);
  }

  @Get('servicios')
  listarServicios(@CurrentUser() user: any) {
    return this.citasService.listarServicios(user.tenantId);
  }

  @Get('profesionales')
  listarProfesionales(@CurrentUser() user: any) {
    return this.citasService.listarProfesionales(user.tenantId);
  }

  @Get('disponibilidad')
  consultarDisponibilidad(
    @CurrentUser() user: any,
    @Query('date') date: string,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.citasService.consultarDisponibilidad(
      user.tenantId,
      date,
      professionalId,
    );
  }

  @Get('mes')
  getCitasDelMes(
    @CurrentUser() user: any,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.citasService.getCitasDelMes(user.tenantId, year, month);
  }

  @Get('dia')
  getCitasDelDia(@CurrentUser() user: any, @Query('date') date: string) {
    return this.citasService.getCitasDelDia(user.tenantId, date);
  }

  @Get('cliente')
  citasCliente(@Query('phone') phone: string, @CurrentUser() user: any) {
    return this.citasService.citasCliente(phone, user.tenantId);
  }

  @Post('bot/crear')
  crearCitaBot(@Body() dto: CrearCitaBotDto, @CurrentUser() user: any) {
    return this.citasService.crearCitaBot(dto, user.tenantId);
  }

  @Get(':id/calendar-link')
  getCalendarLink(@Param('id') id: string, @CurrentUser() user: any) {
    return this.citasService.getCalendarLinks(id, user.tenantId);
  }

  @Get(':id/calendar.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="cita.ics"')
  async getICS(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ics = await this.citasService.generateICS(id, user.tenantId);
    res.send(ics);
  }

  @Put(':id/estado')
  actualizarEstado(
    @Param('id') id: string,
    @Body() dto: ActualizarEstadoCitaDto,
    @CurrentUser() user: any,
  ) {
    return this.citasService.actualizarEstado(id, dto.status, user.tenantId);
  }

  @Put(':id/cancelar')
  cancelarCita(
    @Param('id') id: string,
    @Body() dto: CancelarCitaDto,
    @CurrentUser() user: any,
  ) {
    return this.citasService.cancelarCita(id, dto.clientPhone, user.tenantId);
  }
}
