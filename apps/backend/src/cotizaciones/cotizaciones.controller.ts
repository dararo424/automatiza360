import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CotizacionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CotizacionesService } from './cotizaciones.service';
import { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import { ActualizarEstadoCotizacionDto } from './dto/actualizar-estado-cotizacion.dto';

@UseGuards(JwtAuthGuard)
@Controller('cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @Post()
  crear(@Body() dto: CrearCotizacionDto, @CurrentUser() user: any) {
    return this.cotizacionesService.crear(dto, user.tenantId);
  }

  @Get()
  listar(
    @CurrentUser() user: any,
    @Query('estado') estado?: CotizacionStatus,
  ) {
    return this.cotizacionesService.listar(user.tenantId, estado);
  }

  @Get(':id')
  buscarUno(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cotizacionesService.buscarUno(id, user.tenantId);
  }

  @Patch(':id/estado')
  actualizarEstado(
    @Param('id') id: string,
    @Body() dto: ActualizarEstadoCotizacionDto,
    @CurrentUser() user: any,
  ) {
    return this.cotizacionesService.actualizarEstado(id, dto, user.tenantId);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cotizacionesService.eliminar(id, user.tenantId);
  }
}
