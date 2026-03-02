import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrdenesService } from './ordenes.service';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';

@UseGuards(JwtAuthGuard)
@Controller('ordenes')
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

  @Post()
  crear(@Body() dto: CrearOrdenDto, @CurrentUser() user: any) {
    return this.ordenesService.crear(dto, user.tenantId);
  }

  @Get()
  listar(
    @CurrentUser() user: any,
    @Query('estado') estado?: OrderStatus,
  ) {
    return this.ordenesService.listar(user.tenantId, estado);
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
