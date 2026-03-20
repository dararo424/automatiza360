import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GarantiasController } from './garantias.controller';
import { GarantiasService } from './garantias.service';

@Module({
  imports: [AuthModule],
  controllers: [GarantiasController],
  providers: [GarantiasService],
})
export class GarantiasModule {}
