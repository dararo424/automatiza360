type BadgeType = 'order' | 'ticket' | 'cotizacion' | 'appointment';

const ORDER_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-300',
  CONFIRMED: 'bg-sky-50 text-sky-700 ring-sky-300',
  PREPARING: 'bg-orange-50 text-orange-700 ring-orange-300',
  READY: 'bg-lima-ghost text-selva-800 ring-selva-300',
  DELIVERED: 'bg-bone-deep text-slate-600 ring-slate-300',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-300',
};

const TICKET_COLORS: Record<string, string> = {
  RECEIVED: 'bg-sky-50 text-sky-700 ring-sky-300',
  DIAGNOSING: 'bg-rio-50 text-rio-700 ring-rio-300',
  WAITING_PARTS: 'bg-orange-50 text-orange-700 ring-orange-300',
  REPAIRING: 'bg-amber-50 text-amber-700 ring-amber-300',
  READY: 'bg-lima-ghost text-selva-800 ring-selva-300',
  DELIVERED: 'bg-bone-deep text-slate-600 ring-slate-300',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-300',
};

const COTIZACION_COLORS: Record<string, string> = {
  DRAFT: 'bg-bone-deep text-slate-600 ring-slate-300',
  SENT: 'bg-sky-50 text-sky-700 ring-sky-300',
  ACCEPTED: 'bg-lima-ghost text-selva-800 ring-selva-300',
  REJECTED: 'bg-red-50 text-red-700 ring-red-300',
  EXPIRED: 'bg-orange-50 text-orange-700 ring-orange-300',
};

const APPOINTMENT_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-sky-50 text-sky-700 ring-sky-300',
  CONFIRMED: 'bg-lima-ghost text-selva-800 ring-selva-300',
  COMPLETED: 'bg-lima-ghost text-selva-800 ring-selva-300',
  NO_SHOW: 'bg-red-50 text-red-700 ring-red-300',
  CANCELLED: 'bg-bone-deep text-slate-600 ring-slate-300',
};

const LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Listo',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  RECEIVED: 'Recibido',
  DIAGNOSING: 'Diagnóstico',
  WAITING_PARTS: 'Esperando partes',
  REPAIRING: 'Reparando',
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
  EXPIRED: 'Expirado',
  SCHEDULED: 'Agendada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No asistió',
};

const COLOR_MAPS: Record<BadgeType, Record<string, string>> = {
  order: ORDER_COLORS,
  ticket: TICKET_COLORS,
  cotizacion: COTIZACION_COLORS,
  appointment: APPOINTMENT_COLORS,
};

interface BadgeProps {
  status: string;
  type: BadgeType;
}

export function Badge({ status, type }: BadgeProps) {
  const colorClass = COLOR_MAPS[type][status] ?? 'bg-bone-deep text-slate-600 ring-slate-300';
  const label = LABELS[status] ?? status;

  return (
    <span className={`chip ${colorClass}`}>
      {label}
    </span>
  );
}
