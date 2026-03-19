import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversacionesService } from './conversaciones.service';
import { IngestMessageDto } from './dto/ingest-message.dto';

@Controller('conversaciones')
@UseGuards(JwtAuthGuard)
export class ConversacionesController {
  constructor(private readonly svc: ConversacionesService) {}

  @Post('ingest')
  ingest(@CurrentUser() user: any, @Body() dto: IngestMessageDto) {
    return this.svc.ingestMessage(user.tenantId, dto);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.svc.listConversations(user.tenantId);
  }

  @Get('uso')
  uso(@CurrentUser() user: any) {
    return this.svc.getUsage(user.tenantId);
  }

  @Get(':id')
  get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.getConversation(user.tenantId, id);
  }

  @Patch(':id/leer')
  leer(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.markRead(user.tenantId, id);
  }
}
