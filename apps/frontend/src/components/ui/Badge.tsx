type BadgeType = 'order' | 'ticket' | 'cotizacion';

const ORDER_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-slate-100 text-slate-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const TICKET_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  DIAGNOSING: 'bg-purple-100 text-purple-800',
  WAITING_PARTS: 'bg-orange-100 text-orange-800',
  REPAIRING: 'bg-yellow-100 text-yellow-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-slate-100 text-slate-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const COTIZACION_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
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
};

interface BadgeProps {
  status: string;
  type: BadgeType;
}

export function Badge({ status, type }: BadgeProps) {
  const colorMap =
    type === 'order'
      ? ORDER_COLORS
      : type === 'ticket'
        ? TICKET_COLORS
        : COTIZACION_COLORS;

  const colorClass = colorMap[status] ?? 'bg-gray-100 text-gray-800';
  const label = LABELS[status] ?? status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
