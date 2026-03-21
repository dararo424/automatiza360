import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NpsService } from './nps.service';
import { RegistrarNpsDto } from './dto/registrar-nps.dto';

@Controller('nps')
@UseGuards(JwtAuthGuard)
export class NpsController {
  constructor(private readonly npsService: NpsService) {}

  @Post('bot')
  registrar(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: RegistrarNpsDto,
  ) {
    return this.npsService.registrar(user.tenantId, dto);
  }

  @Get('stats')
  getStats(@CurrentUser() user: { tenantId: string }) {
    return this.npsService.getStats(user.tenantId);
  }
}
