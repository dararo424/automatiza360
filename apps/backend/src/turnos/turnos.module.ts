import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TurnosController } from './turnos.controller';
import { TurnosService } from './turnos.service';

@Module({
  imports: [AuthModule],
  controllers: [TurnosController],
  providers: [TurnosService],
})
export class TurnosModule {}
