import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    this.client = new PrismaClient({ adapter });
  }

  // Model proxies
  get user() { return this.client.user; }
  get tenant() { return this.client.tenant; }
  get order() { return this.client.order; }
  get orderItem() { return this.client.orderItem; }
  get product() { return this.client.product; }
  get ticket() { return this.client.ticket; }
  get cotizacion() { return this.client.cotizacion; }
  get cotizacionItem() { return this.client.cotizacionItem; }
  get notificacion() { return this.client.notificacion; }
  get supplier() { return this.client.supplier; }
  get supplierProduct() { return this.client.supplierProduct; }
  get menuDia() { return this.client.menuDia; }
  get platoMenuDia() { return this.client.platoMenuDia; }
  get professional() { return this.client.professional; }
  get schedule() { return this.client.schedule; }
  get service() { return this.client.service; }
  get appointment() { return this.client.appointment; }
  get paymentIntent() { return this.client.paymentIntent; }
  get conversation() { return this.client.conversation; }
  get message() { return this.client.message; }
  get contact() { return this.client.contact; }
  get referralCode() { return this.client.referralCode; }
  get referral() { return this.client.referral; }
  get apiKey() { return this.client.apiKey; }
  get gasto() { return this.client.gasto; }
  get campaña() { return this.client.campaña; }
  get garantia() { return this.client.garantia; }

  // Transaction support
  $transaction: PrismaClient['$transaction'] = (...args: any[]) =>
    (this.client.$transaction as any)(...args);

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
