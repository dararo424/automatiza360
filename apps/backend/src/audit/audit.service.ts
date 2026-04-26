import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditEvent =
  // Auth
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.register'
  | 'auth.password_reset.requested'
  | 'auth.password_reset.completed'
  // Payments
  | 'payment.initiated'
  | 'payment.completed'
  | 'payment.failed'
  | 'subscription.activated'
  | 'subscription.cancelled'
  | 'subscription.reactivated'
  // Plan changes
  | 'plan.upgraded'
  | 'trial.extended'
  // Referrals
  | 'referral.rewarded'
  // Hazlo por mí
  | 'hazlo.requested'
  | 'hazlo.completed';

export interface AuditEntry {
  event: AuditEvent;
  userId?: string;
  tenantId?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AUDIT');

  constructor(private readonly prisma: PrismaService) {}

  log(entry: AuditEntry): void {
    this.logger.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: entry.event,
        userId: entry.userId ?? null,
        tenantId: entry.tenantId ?? null,
        ip: entry.ip ?? null,
        ...(entry.metadata ? { metadata: entry.metadata } : {}),
      }),
    );

    this.prisma.auditLog
      .create({
        data: {
          event: entry.event,
          userId: entry.userId ?? null,
          tenantId: entry.tenantId ?? null,
          ip: entry.ip ?? null,
          ...(entry.metadata ? { metadata: entry.metadata as object } : {}),
        },
      })
      .catch((err: unknown) => {
        this.logger.error(`Failed to persist audit log: ${(err as Error).message}`);
      });
  }
}
