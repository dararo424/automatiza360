import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { RemindersModule } from './reminders/reminders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductosModule } from './productos/productos.module';
import { OrdenesModule } from './ordenes/ordenes.module';
import { InventarioModule } from './inventario/inventario.module';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { TicketsModule } from './tickets/tickets.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { MenuDiaModule } from './menu-dia/menu-dia.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CitasModule } from './citas/citas.module';
import { CalendarModule } from './calendar/calendar.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ConversacionesModule } from './conversaciones/conversaciones.module';
import { ContactosModule } from './contactos/contactos.module';
import { ReferidosModule } from './referidos/referidos.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { SoporteModule } from './soporte/soporte.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    EmailModule,
    RemindersModule,
    AuthModule,
    ProductosModule,
    OrdenesModule,
    InventarioModule,
    CotizacionesModule,
    NotificacionesModule,
    TicketsModule,
    ProveedoresModule,
    MenuDiaModule,
    SubscriptionsModule,
    CitasModule,
    CalendarModule,
    PaymentsModule,
    AdminModule,
    DashboardModule,
    ConversacionesModule,
    ContactosModule,
    ReferidosModule,
    ApiKeysModule,
    SoporteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
