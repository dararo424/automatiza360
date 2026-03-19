import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCitasDelMes, getCitasDelDia } from '../../api/citas';
import { CalendarioMes } from './components/CalendarioMes';
import { CitasDelDia } from './components/CitasDelDia';
import { ModalSincronizarCalendario } from './components/ModalSincronizarCalendario';
import type { Cita } from '../../types';

function todayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AgendaPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(todayStr());
  const [showModal, setShowModal] = useState(false);
  const [calendarCita, setCalendarCita] = useState<Cita | null>(null);

  const { data: mesData, isLoading: loadingMes } = useQuery({
    queryKey: ['citas-mes', year, month],
    queryFn: () => getCitasDelMes(year, month),
  });

  const { data: citasDia = [], isLoading: loadingDia } = useQuery({
    queryKey: ['citas-dia', selectedDay],
    queryFn: () => getCitasDelDia(selectedDay!),
    enabled: !!selectedDay,
  });

  function handleChangeMonth(y: number, m: number) {
    setYear(y);
    setMonth(m);
    setSelectedDay(null);
  }

  function openCalendarModal(cita: Cita) {
    setCalendarCita(cita);
    setShowModal(true);
  }

  function closeCalendarModal() {
    setShowModal(false);
    setCalendarCita(null);
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Agenda</h2>
          <p className="text-sm text-slate-500">
            Gestiona las citas de tu consultorio
          </p>
        </div>
        <button
          onClick={() => { setCalendarCita(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          📅 Sincronizar calendario
        </button>
      </div>

      {/* Two-column layout: stacked on mobile, side-by-side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
        {/* Left: calendar */}
        <div className="flex flex-col gap-3">
          {loadingMes ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CalendarioMes
              year={year}
              month={month}
              citasPorDia={mesData?.counts ?? {}}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onChangeMonth={handleChangeMonth}
            />
          )}

          {/* Monthly summary */}
          {mesData && (
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-600">
              <span className="font-medium text-slate-800">
                {mesData.appointments.length}
              </span>{' '}
              cita{mesData.appointments.length !== 1 ? 's' : ''} este mes
            </div>
          )}
        </div>

        {/* Right: day detail */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 min-h-64">
          <CitasDelDia
            date={selectedDay}
            citas={citasDia}
            isLoading={loadingDia}
            onCalendar={openCalendarModal}
          />
        </div>
      </div>

      {showModal && (
        <ModalSincronizarCalendario
          cita={calendarCita}
          onClose={closeCalendarModal}
        />
      )}
    </div>
  );
}
