import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TurnosService } from './turnos.service';
import { CrearTurnoDto } from './dto/crear-turno.dto';

@UseGuards(JwtAuthGuard)
@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Get()
  getTurnosSemana(
    @Query('semana') semana: string,
    @CurrentUser() user: any,
  ) {
    const s = semana ?? new Date().toISOString().slice(0, 10);
    return this.turnosService.getTurnosSemana(user.tenantId, s);
  }

  @Post()
  crearTurno(@Body() dto: CrearTurnoDto, @CurrentUser() user: any) {
    return this.turnosService.crearTurno(user.tenantId, dto, user.role);
  }

  @Delete(':id')
  eliminarTurno(@Param('id') id: string, @CurrentUser() user: any) {
    return this.turnosService.eliminarTurno(id, user.tenantId, user.role);
  }
}
