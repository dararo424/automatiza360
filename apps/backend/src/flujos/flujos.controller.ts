import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FlujoService } from './flujos.service';

@Controller('flujos')
@UseGuards(JwtAuthGuard)
export class FlujoController {
  constructor(private readonly flujoService: FlujoService) {}

  @Get()
  getFlujos(@CurrentUser() user: { tenantId: string }) {
    return this.flujoService.getFlujos(user.tenantId);
  }

  @Patch()
  updateFlujos(
    @CurrentUser() user: { tenantId: string },
    @Body('flujos') flujos: string[],
  ) {
    return this.flujoService.updateFlujos(user.tenantId, flujos);
  }
}
