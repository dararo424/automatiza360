import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('trial-info')
  getTrialInfo(@CurrentUser() user: { tenantId: string }) {
    return this.subscriptionsService.getTrialInfo(user.tenantId);
  }

  @Get('plan-info')
  getPlanInfo(@CurrentUser() user: { tenantId: string }) {
    return this.subscriptionsService.getPlanInfo(user.tenantId);
  }

  @Post('upgrade')
  iniciarUpgrade(
    @Body('plan') plan: string,
    @CurrentUser() user: { tenantId: string },
  ) {
    return this.subscriptionsService.iniciarUpgrade(user.tenantId, plan);
  }
}
