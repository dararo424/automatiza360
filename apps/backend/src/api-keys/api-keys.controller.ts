import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { PlanLimitGuard } from '../common/guards/plan-limit.guard';
import { RequiresPlanFeature } from '../common/decorators/plan-feature.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly svc: ApiKeysService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.svc.list(user.tenantId);
  }

  @Post()
  @UseGuards(PlanLimitGuard)
  @RequiresPlanFeature('API_KEYS')
  create(@CurrentUser() user: any, @Body() dto: CreateApiKeyDto) {
    return this.svc.create(user.tenantId, dto);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.revoke(user.tenantId, id);
  }
}
