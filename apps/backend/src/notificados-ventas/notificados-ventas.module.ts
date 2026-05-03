import { Global, Module } from '@nestjs/common';
import { NotificadosVentasController } from './notificados-ventas.controller';
import { NotificadosVentasService } from './notificados-ventas.service';

@Global()
@Module({
  controllers: [NotificadosVentasController],
  providers: [NotificadosVentasService],
  exports: [NotificadosVentasService],
})
export class NotificadosVentasModule {}
