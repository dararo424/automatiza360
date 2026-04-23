import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HazloPorMiService } from './hazlo-por-mi.service';

@Controller('hazlo-por-mi')
@UseGuards(JwtAuthGuard)
export class HazloPorMiController {
  constructor(private readonly svc: HazloPorMiService) {}

  @Post()
  crear(
    @CurrentUser() user: { tenantId: string },
    @Body('descripcion') descripcion: string,
  ) {
    return this.svc.crearSolicitud(user.tenantId, descripcion);
  }

  @Get()
  getMis(@CurrentUser() user: { tenantId: string }) {
    return this.svc.getMisSolicitudes(user.tenantId);
  }
}
