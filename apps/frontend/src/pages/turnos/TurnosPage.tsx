import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTurnosSemana, crearTurno, eliminarTurno, type Turno } from '../../api/turnos';
import { getEquipo } from '../../api/equipo';

const USER_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500',
  'bg-cyan-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500',
];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ModalTurno({
  semana,
  onClose,
}: {
  semana: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: equipo = [] } = useQuery({ queryKey: ['equipo'], queryFn: getEquipo });
  const [userId, setUserId] = useState('');
  const [fecha, setFecha] = useState(semana);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('17:00');
  const [notas, setNotas] = useState('');

  const mutation = useMutation({
    mutationFn: () => crearTurno({ userId, fecha, horaInicio, horaFin, notas }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['turnos'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-white font-bold mb-4">Asignar turno</h2>
        <div className="space-y-3">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm"
          >
            <option value="">Seleccionar empleado</option>
            {equipo.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Hora inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Hora fin</label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm"
              />
            </div>
          </div>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas (opcional)"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm h-16 resize-none"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => mutation.mutate()}
            disabled={!userId || !fecha || mutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold"
          >
            Asignar
          </button>
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function TurnosPage() {
  const qc = useQueryClient();
  const [semanaBase, setSemanaBase] = useState(() => formatDate(getMonday(new Date())));
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['turnos', semanaBase],
    queryFn: () => getTurnosSemana(semanaBase),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarTurno(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['turnos'] }),
  });

  const prevSemana = () => {
    const d = new Date(semanaBase);
    d.setDate(d.getDate() - 7);
    setSemanaBase(formatDate(d));
  };
  const nextSemana = () => {
    const d = new Date(semanaBase);
    d.setDate(d.getDate() + 7);
    setSemanaBase(formatDate(d));
  };

  // Get unique users with a color
  const turnos: Turno[] = data?.turnos ?? [];
  const userIds = [...new Set(turnos.map((t) => t.userId))];
  const userColorMap = Object.fromEntries(userIds.map((id, i) => [id, USER_COLORS[i % USER_COLORS.length]]));

  // Build week days
  const monday = getMonday(new Date(semanaBase));
  const weekDays = DAYS.map((label, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = formatDate(date);
    const dayTurnos = turnos.filter((t) => t.fecha.startsWith(dateStr));
    return { label, dateStr, dayTurnos };
  });

  const semanaLabel = data
    ? `${new Date(data.semanaInicio).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} – ${new Date(data.semanaFin).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : '';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Turnos del equipo</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + Asignar turno
        </button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={prevSemana} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
          ← Semana anterior
        </button>
        <p className="text-white font-medium">{semanaLabel}</p>
        <button onClick={nextSemana} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
          Semana siguiente →
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Cargando turnos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map(({ label, dateStr, dayTurnos }) => (
            <div key={dateStr} className="bg-slate-800 rounded-xl p-3 min-h-32">
              <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
              <p className="text-slate-500 text-xs mb-2">
                {new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
              </p>
              <div className="space-y-1.5">
                {dayTurnos.map((t) => (
                  <div
                    key={t.id}
                    className={`${userColorMap[t.userId] ?? 'bg-slate-600'} rounded-lg p-2 text-white text-xs`}
                  >
                    <p className="font-semibold truncate">{t.user.name}</p>
                    <p className="opacity-90">{t.horaInicio} – {t.horaFin}</p>
                    {t.notas && <p className="opacity-75 truncate">{t.notas}</p>}
                    <button
                      onClick={() => eliminarMutation.mutate(t.id)}
                      className="mt-1 text-white/70 hover:text-white underline text-xs"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ModalTurno semana={semanaBase} onClose={() => setShowModal(false)} />}
    </div>
  );
}
