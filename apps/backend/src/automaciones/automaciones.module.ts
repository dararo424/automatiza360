import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AutomacionesController } from './automaciones.controller';
import { AutomacionesService } from './automaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [AutomacionesController],
  providers: [AutomacionesService],
  exports: [AutomacionesService],
})
export class AutomacionesModule {}
