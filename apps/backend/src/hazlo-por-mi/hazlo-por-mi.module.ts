import { Module } from '@nestjs/common';
import { HazloPorMiController } from './hazlo-por-mi.controller';
import { HazloPorMiService } from './hazlo-por-mi.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [HazloPorMiController],
  providers: [HazloPorMiService],
})
export class HazloPorMiModule {}
