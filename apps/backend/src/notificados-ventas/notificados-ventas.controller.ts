import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificadosVentasService } from './notificados-ventas.service';
import {
  ActualizarNotificadoVentasDto,
  CrearNotificadoVentasDto,
} from './dto/notificado-ventas.dto';

@Controller('notificados-ventas')
@UseGuards(JwtAuthGuard)
export class NotificadosVentasController {
  constructor(private readonly svc: NotificadosVentasService) {}

  @Get()
  list(@CurrentUser() user: { tenantId: string }) {
    return this.svc.list(user.tenantId);
  }

  @Post()
  crear(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: CrearNotificadoVentasDto,
  ) {
    return this.svc.crear(user.tenantId, dto);
  }

  @Patch(':id')
  actualizar(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @Body() dto: ActualizarNotificadoVentasDto,
  ) {
    return this.svc.actualizar(user.tenantId, id, dto);
  }

  @Delete(':id')
  eliminar(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.svc.eliminar(user.tenantId, id);
  }

  @Post(':id/probar')
  probar(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.svc.probar(user.tenantId, id);
  }
}
