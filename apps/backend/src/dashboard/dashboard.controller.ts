import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('metricas')
  getMetricas(@CurrentUser() user: { tenantId: string }) {
    return this.dashboard.getMetricas(user.tenantId);
  }

  @Get('bot-metricas')
  getBotMetricas(@CurrentUser() user: { tenantId: string }) {
    return this.dashboard.getBotMetricas(user.tenantId);
  }
}
