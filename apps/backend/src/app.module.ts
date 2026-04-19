import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { validationSchema } from './config/env.validation';
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
import { GastosModule } from './gastos/gastos.module';
import { CampañasModule } from './campañas/campañas.module';
import { GarantiasModule } from './garantias/garantias.module';
import { PerfilModule } from './perfil/perfil.module';
import { AutomacionesModule } from './automaciones/automaciones.module';
import { ResenasModule } from './resenas/resenas.module';
import { ImportacionModule } from './importacion/importacion.module';
import { ComprasModule } from './compras/compras.module';
import { TurnosModule } from './turnos/turnos.module';
import { CuponesModule } from './cupones/cupones.module';
import { PushModule } from './push/push.module';
import { CajaModule } from './caja/caja.module';
import { BillingModule } from './billing/billing.module';
import { FlujoModule } from './flujos/flujos.module';
import { NpsModule } from './nps/nps.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { HealthModule } from './health/health.module';
import { TallasModule } from './tallas/tallas.module';
import { AdminBotModule } from './admin-bot/admin-bot.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: { abortEarly: false },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 60 },
    ]),
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
    GastosModule,
    CampañasModule,
    GarantiasModule,
    PerfilModule,
    AutomacionesModule,
    ResenasModule,
    ImportacionModule,
    ComprasModule,
    TurnosModule,
    CuponesModule,
    PushModule,
    CajaModule,
    BillingModule,
    FlujoModule,
    NpsModule,
    SucursalesModule,
    HealthModule,
    TallasModule,
    AdminBotModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
