import { Module } from '@nestjs/common';
import { AdminBotController } from './admin-bot.controller';
import { AdminBotService } from './admin-bot.service';
import { AdminBotResumenesService } from './admin-bot-resumenes.service';
import { AdminBotMessagingService } from './admin-bot-messaging.service';

@Module({
  controllers: [AdminBotController],
  providers: [AdminBotService, AdminBotResumenesService, AdminBotMessagingService],
})
export class AdminBotModule {}
