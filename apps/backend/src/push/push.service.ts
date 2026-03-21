import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private vapidConfigured = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL;

    if (!publicKey || !privateKey || !email) {
      this.logger.warn(
        'VAPID keys not configured. Push notifications will be disabled. ' +
          'Generate keys with: node -e "const wp=require(\'web-push\'); console.log(JSON.stringify(wp.generateVAPIDKeys()))"',
      );
      return;
    }

    webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
    this.vapidConfigured = true;
    this.logger.log('Push notifications configured.');
  }

  async saveSubscription(
    tenantId: string,
    userId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: { tenantId, userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      create: {
        tenantId,
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    });
  }

  async removeSubscription(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  async sendToTenant(tenantId: string, title: string, body: string, url?: string) {
    if (!this.vapidConfigured) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { tenantId },
    });

    const payload = JSON.stringify({ title, body, url: url ?? '/' });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (err: any) {
        this.logger.warn(
          `Push failed for endpoint ${sub.endpoint.substring(0, 40)}...: ${err?.statusCode ?? err?.message}`,
        );
        // Remove invalid subscriptions (410 Gone)
        if (err?.statusCode === 410) {
          await this.prisma.pushSubscription
            .deleteMany({ where: { endpoint: sub.endpoint } })
            .catch(() => {});
        }
      }
    }
  }
}
