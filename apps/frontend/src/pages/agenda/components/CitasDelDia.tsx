import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actualizarEstadoCita } from '../../../api/citas';
import type { Cita, AppointmentStatus } from '../../../types';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-slate-100 text-slate-600',
  NO_SHOW: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Programada',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No asistió',
};

function CitaBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function CitaCard({
  cita,
  onCalendar,
}: {
  cita: Cita;
  onCalendar: (cita: Cita) => void;
}) {
  const qc = useQueryClient();

  const { mutate: cambiar, isPending } = useMutation({
    mutationFn: (status: AppointmentStatus) =>
      actualizarEstadoCita(cita.id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['citas-mes'] });
      void qc.invalidateQueries({ queryKey: ['citas-dia'] });
    },
  });

  const hora = new Date(cita.date).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isActive =
    cita.status !== 'CANCELLED' && cita.status !== 'COMPLETED';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 tabular-nums">
            {hora}
          </span>
          <CitaBadge status={cita.status} />
        </div>
        <button
          onClick={() => onCalendar(cita)}
          title="Ver links de calendario"
          className="text-slate-400 hover:text-indigo-600 transition-colors text-base leading-none"
        >
          📅
        </button>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <span className="text-slate-500">Paciente:</span>{' '}
          <span className="font-medium text-slate-800">{cita.clientName}</span>
        </div>
        <div>
          <span className="text-slate-500">Teléfono:</span>{' '}
          <span className="text-slate-700">{cita.clientPhone}</span>
        </div>
        <div>
          <span className="text-slate-500">Servicio:</span>{' '}
          <span className="text-slate-700">{cita.service.name}</span>
        </div>
        {cita.professional && (
          <div>
            <span className="text-slate-500">Profesional:</span>{' '}
            <span className="text-slate-700">{cita.professional.name}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {isActive && (
        <div className="flex items-center gap-2 pt-1">
          {cita.status !== 'CONFIRMED' && (
            <button
              onClick={() => cambiar('CONFIRMED')}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
            >
              Confirmar
            </button>
          )}
          <button
            onClick={() => cambiar('COMPLETED')}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg transition-colors"
          >
            Completar
          </button>
          <button
            onClick={() => cambiar('CANCELLED')}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

interface CitasDelDiaProps {
  date: string | null;
  citas: Cita[];
  isLoading: boolean;
  onCalendar: (cita: Cita) => void;
}

export function CitasDelDia({
  date,
  citas,
  isLoading,
  onCalendar,
}: CitasDelDiaProps) {
  const dateLabel = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="flex flex-col gap-3 min-h-0">
      {/* Panel header */}
      <div className="flex-shrink-0">
        {date ? (
          <>
            <h3 className="text-base font-semibold text-slate-800 capitalize">
              {dateLabel}
            </h3>
            <p className="text-sm text-slate-500">
              {citas.length} cita{citas.length !== 1 ? 's' : ''}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Selecciona un día del calendario
          </p>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !date ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-12">
          ← Haz clic en un día
        </div>
      ) : citas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
          <span className="text-3xl mb-2">📭</span>
          <p className="text-sm">No hay citas para este día</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {citas.map((c) => (
            <CitaCard key={c.id} cita={c} onCalendar={onCalendar} />
          ))}
        </div>
      )}
    </div>
  );
}
