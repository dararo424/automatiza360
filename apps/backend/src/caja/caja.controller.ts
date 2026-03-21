import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CajaService } from './caja.service';

@Controller('caja')
@UseGuards(JwtAuthGuard)
export class CajaController {
  constructor(private readonly svc: CajaService) {}

  @Get('corte')
  getCorteDiario(@CurrentUser() user: any, @Query('fecha') fecha?: string) {
    return this.svc.getCorteDiario(user.tenantId, fecha);
  }
}
