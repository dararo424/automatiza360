import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { EmailModule } from '../email/email.module';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

@Module({
  imports: [DashboardModule, EmailModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
