import { Module } from '@nestjs/common';
import { AdminBotController } from './admin-bot.controller';
import { AdminBotService } from './admin-bot.service';

@Module({
  controllers: [AdminBotController],
  providers: [AdminBotService],
})
export class AdminBotModule {}
