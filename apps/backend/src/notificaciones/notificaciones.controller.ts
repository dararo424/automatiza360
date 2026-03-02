import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificacionesService } from './notificaciones.service';

@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  listar(@CurrentUser() user: any, @Query('leidas') leidas?: string) {
    const leidasBool =
      leidas === 'true' ? true : leidas === 'false' ? false : undefined;
    return this.notificacionesService.listar(user.tenantId, leidasBool);
  }

  @Patch('leer-todas')
  marcarTodasLeidas(@CurrentUser() user: any) {
    return this.notificacionesService.marcarTodasLeidas(user.tenantId);
  }

  @Patch(':id/leer')
  marcarLeida(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificacionesService.marcarLeida(id, user.tenantId);
  }
}
