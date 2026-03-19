import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { RemindersService } from './reminders.service';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [RemindersService],
})
export class RemindersModule {}
