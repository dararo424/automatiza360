import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCalendarLinks, downloadICS } from '../../../api/citas';
import type { Cita } from '../../../types';

interface ModalSincronizarCalendarioProps {
  cita: Cita | null;
  onClose: () => void;
}

export function ModalSincronizarCalendario({
  cita,
  onClose,
}: ModalSincronizarCalendarioProps) {
  const [downloading, setDownloading] = useState(false);

  const { data: links, isLoading } = useQuery({
    queryKey: ['calendar-links', cita?.id],
    queryFn: () => getCalendarLinks(cita!.id),
    enabled: !!cita,
  });

  async function handleDownloadICS() {
    if (!cita) return;
    setDownloading(true);
    try {
      await downloadICS(cita.id);
    } finally {
      setDownloading(false);
    }
  }

  const hora = cita
    ? new Date(cita.date).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const fecha = cita
    ? new Date(`${cita.date.substring(0, 10)}T12:00:00`).toLocaleDateString(
        'es-CO',
        { dateStyle: 'long' },
      )
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            📅 Sincronizar con calendario
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Appointment summary */}
        {cita && (
          <div className="bg-slate-50 rounded-lg p-4 mb-5 text-sm">
            <p className="font-medium text-slate-800">{cita.service.name}</p>
            <p className="text-slate-600 mt-0.5">
              {cita.clientName} · {fecha} a las {hora}
            </p>
            {cita.professional && (
              <p className="text-slate-500 mt-0.5">
                Con {cita.professional.name}
              </p>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Google Calendar */}
            <a
              href={links?.googleUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-slate-200
                hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700
                ${!links ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <span className="text-xl">🗓️</span>
              <div className="text-left">
                <p className="font-medium">Google Calendar</p>
                <p className="text-xs text-slate-500 font-normal">
                  Abre Google Calendar para agregar la cita
                </p>
              </div>
              <span className="ml-auto text-slate-400">↗</span>
            </a>

            {/* Outlook */}
            <a
              href={links?.outlookUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-slate-200
                hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700
                ${!links ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <span className="text-xl">📧</span>
              <div className="text-left">
                <p className="font-medium">Outlook / Hotmail</p>
                <p className="text-xs text-slate-500 font-normal">
                  Abre Outlook Web para agregar la cita
                </p>
              </div>
              <span className="ml-auto text-slate-400">↗</span>
            </a>

            {/* ICS Download */}
            <button
              onClick={handleDownloadICS}
              disabled={!cita || downloading}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors text-sm font-medium text-slate-700 text-left"
            >
              <span className="text-xl">⬇️</span>
              <div>
                <p className="font-medium">
                  {downloading ? 'Descargando...' : 'Descargar archivo .ics'}
                </p>
                <p className="text-xs text-slate-500 font-normal">
                  Compatible con Apple Calendar, Outlook y otros
                </p>
              </div>
            </button>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400 text-center">
          Los links abren tu aplicación de calendario para confirmar el evento
        </p>
      </div>
    </div>
  );
}
