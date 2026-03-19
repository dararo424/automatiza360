import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { SoporteController } from './soporte.controller';
import { SoporteService } from './soporte.service';

@Module({
  imports: [AuthModule, NotificacionesModule],
  controllers: [SoporteController],
  providers: [SoporteService],
})
export class SoporteModule {}
