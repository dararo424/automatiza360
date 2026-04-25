import { Injectable, Logger } from '@nestjs/common';

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
  | 'subscription.cancelled';

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
  }
}
