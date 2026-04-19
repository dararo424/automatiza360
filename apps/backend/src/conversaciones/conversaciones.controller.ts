import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversacionesService } from './conversaciones.service';
import { IngestMessageDto } from './dto/ingest-message.dto';

@ApiTags('conversaciones')
@ApiBearerAuth()
@Controller('conversaciones')
@UseGuards(JwtAuthGuard)
export class ConversacionesController {
  constructor(private readonly svc: ConversacionesService) {}

  @SkipThrottle()
  @Post('ingest')
  ingest(@CurrentUser() user: any, @Body() dto: IngestMessageDto) {
    return this.svc.ingestMessage(user.tenantId, dto);
  }

  /** Llamado por el AI service antes de procesar cada mensaje de cliente. */
  @SkipThrottle()
  @Post('track')
  track(@CurrentUser() user: any, @Body() body: { clientPhone: string }) {
    return this.svc.checkAndTrackConversation(user.tenantId, body.clientPhone);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.svc.listConversations(user.tenantId);
  }

  @Get('uso')
  uso(@CurrentUser() user: any) {
    return this.svc.getUsage(user.tenantId);
  }

  @Get('sesion/:phone')
  getSesion(
    @CurrentUser() user: any,
    @Param('phone') phone: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getSesion(user.tenantId, phone, limit ? parseInt(limit, 10) : 10);
  }

  @Get(':id')
  get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.getConversation(user.tenantId, id);
  }

  @Patch(':id/leer')
  leer(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.markRead(user.tenantId, id);
  }

  @Patch(':id/escalar')
  escalar(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.escalarConversacion(user.tenantId, id);
  }

  @Post('escalar-por-telefono')
  escalarPorTelefono(@CurrentUser() user: any, @Body() body: { phone: string }) {
    return this.svc.escalarConversacionPorTelefono(user.tenantId, body.phone);
  }
}
