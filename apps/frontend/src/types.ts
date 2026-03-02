export type Industry = 'RESTAURANT' | 'TECH_STORE' | 'CLINIC' | 'OTHER';
export type Role = 'OWNER' | 'ADMIN' | 'STAFF';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';
export type TicketStatus =
  | 'RECEIVED'
  | 'DIAGNOSING'
  | 'WAITING_PARTS'
  | 'REPAIRING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';
export type CotizacionStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  industry: Industry;
  active: boolean;
}

export interface UserProfile extends AuthUser {
  tenant: Tenant;
}

export interface Producto {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: string;
  tenantId: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Orden {
  id: string;
  number: number;
  status: OrderStatus;
  total: number;
  notes?: string;
  phone?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CotizacionItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
  subtotal: number;
}

export interface Cotizacion {
  id: string;
  number: number;
  clientName: string;
  clientPhone?: string;
  notes?: string;
  total: number;
  status: CotizacionStatus;
  validUntil?: string;
  createdAt: string;
  items: CotizacionItem[];
}

export interface Ticket {
  id: string;
  number: number;
  clientName: string;
  clientPhone: string;
  device: string;
  issue: string;
  diagnosis?: string;
  status: TicketStatus;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notificacion {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
