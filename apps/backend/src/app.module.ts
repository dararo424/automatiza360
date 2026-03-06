import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductosModule } from './productos/productos.module';
import { OrdenesModule } from './ordenes/ordenes.module';
import { InventarioModule } from './inventario/inventario.module';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { TicketsModule } from './tickets/tickets.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { MenuDiaModule } from './menu-dia/menu-dia.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductosModule,
    OrdenesModule,
    InventarioModule,
    CotizacionesModule,
    NotificacionesModule,
    TicketsModule,
    ProveedoresModule,
    MenuDiaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
