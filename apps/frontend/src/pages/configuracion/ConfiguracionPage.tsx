import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMiPerfil, actualizarPerfil } from '../../api/perfil';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin;

export function ConfiguracionPage() {
  const qc = useQueryClient();
  const { data: perfil, isLoading } = useQuery({
    queryKey: ['mi-perfil'],
    queryFn: getMiPerfil,
  });

  const [form, setForm] = useState({
    descripcion: '',
    horario: '',
    logoUrl: '',
    direccion: '',
    ciudad: '',
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (perfil) {
      setForm({
        descripcion: perfil.descripcion ?? '',
        horario: perfil.horario ?? '',
        logoUrl: perfil.logoUrl ?? '',
        direccion: perfil.direccion ?? '',
        ciudad: perfil.ciudad ?? '',
      });
    }
  }, [perfil]);

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: () => actualizarPerfil(form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mi-perfil'] });
    },
  });

  const publicUrl = perfil ? `${APP_URL}/negocio/${perfil.slug}` : '';

  const handleCopy = () => {
    if (!publicUrl) return;
    void navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return <div className="h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Configuración del negocio</h1>

      {/* Public page preview */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-green-800 mb-2">Tu página pública</p>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded break-all flex-1 min-w-0">
            {publicUrl}
          </code>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shrink-0"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs border border-green-600 text-green-700 hover:bg-green-100 rounded-lg transition-colors shrink-0"
          >
            Ver página
          </a>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Descripción del negocio
          </label>
          <textarea
            rows={3}
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="Cuéntales a tus clientes de qué trata tu negocio..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Horario de atención
          </label>
          <input
            type="text"
            value={form.horario}
            onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}
            placeholder="Ej: Lun-Vie 9am-6pm, Sáb 9am-2pm"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            URL del logo
          </label>
          <div className="flex gap-3 items-start">
            <input
              type="text"
              value={form.logoUrl}
              onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              placeholder="https://ejemplo.com/logo.png"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {form.logoUrl && (
              <img
                src={form.logoUrl}
                alt="Logo preview"
                className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Dirección
          </label>
          <input
            type="text"
            value={form.direccion}
            onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
            placeholder="Calle 123 #45-67"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ciudad
          </label>
          <input
            type="text"
            value={form.ciudad}
            onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
            placeholder="Bogotá"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {isSuccess && (
            <span className="text-sm text-green-600 font-medium">Cambios guardados</span>
          )}
        </div>
      </div>
    </div>
  );
}
