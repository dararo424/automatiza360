// Mock for @prisma/client in Jest tests.
// Prisma 7 requires `prisma generate` to create the runtime client module.
// This mock allows unit tests to run without a generated Prisma client.

export const PrismaClient = jest.fn().mockImplementation(() => ({}));

// Enums
export enum Role { OWNER = 'OWNER', ADMIN = 'ADMIN', STAFF = 'STAFF' }
export enum Plan { STARTER = 'STARTER', PRO = 'PRO', BUSINESS = 'BUSINESS' }
export enum Industry {
  RESTAURANT = 'RESTAURANT',
  TECH_STORE = 'TECH_STORE',
  CLINIC = 'CLINIC',
  BEAUTY = 'BEAUTY',
  OTHER = 'OTHER',
}
export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
export enum TicketStatus {
  RECEIVED = 'RECEIVED',
  DIAGNOSING = 'DIAGNOSING',
  WAITING_PARTS = 'WAITING_PARTS',
  REPAIRING = 'REPAIRING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}
export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}
export enum CotizacionStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

// Type stubs
export type User = any;
export type Tenant = any;
