import { Module } from '@nestjs/common';
import { FlujoController } from './flujos.controller';
import { FlujoService } from './flujos.service';

@Module({
  controllers: [FlujoController],
  providers: [FlujoService],
  exports: [FlujoService],
})
export class FlujoModule {}
