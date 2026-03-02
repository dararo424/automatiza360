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
