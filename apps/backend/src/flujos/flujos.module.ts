import { Global, Module } from '@nestjs/common';
import { FlujoController } from './flujos.controller';
import { FlujoService } from './flujos.service';

@Global()
@Module({
  controllers: [FlujoController],
  providers: [FlujoService],
  exports: [FlujoService],
})
export class FlujoModule {}
