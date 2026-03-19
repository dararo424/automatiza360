import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReferidosService } from './referidos.service';

@Controller('referidos')
@UseGuards(JwtAuthGuard)
export class ReferidosController {
  constructor(private readonly svc: ReferidosService) {}

  @Get('mi-codigo')
  getMiCodigo(@CurrentUser() user: any) {
    return this.svc.getMiCodigo(user.tenantId);
  }

  @Get()
  getReferrals(@CurrentUser() user: any) {
    return this.svc.getReferrals(user.tenantId);
  }
}
