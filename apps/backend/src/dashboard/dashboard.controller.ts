import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
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

  @Get('tendencias')
  getTendencias(
    @CurrentUser() user: { tenantId: string },
    @Query('days') days?: string,
  ) {
    return this.dashboard.getTendencias(user.tenantId, days ? parseInt(days, 10) : 30);
  }

  @Get('roi')
  getRoi(@CurrentUser() user: { tenantId: string }) {
    return this.dashboard.getRoi(user.tenantId);
  }
}
