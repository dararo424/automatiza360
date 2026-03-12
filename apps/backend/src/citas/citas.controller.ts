import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CitasService } from './citas.service';
import { CrearCitaBotDto } from './dto/crear-cita-bot.dto';
import { CancelarCitaDto } from './dto/cancelar-cita.dto';

@UseGuards(JwtAuthGuard)
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

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

  @Post('bot/crear')
  crearCitaBot(@Body() dto: CrearCitaBotDto, @CurrentUser() user: any) {
    return this.citasService.crearCitaBot(dto, user.tenantId);
  }

  @Get('cliente')
  citasCliente(@Query('phone') phone: string, @CurrentUser() user: any) {
    return this.citasService.citasCliente(phone, user.tenantId);
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
