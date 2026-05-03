import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMiPerfil, actualizarPerfil } from '../../api/perfil';
import { crearSolicitudHazlo, getMisSolicitudesHazlo } from '../../api/hazlo-por-mi';
import { getInstagramStatus, getInstagramConnectUrl, disconnectInstagram } from '../../api/integraciones';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { NotificadosVentasSection } from '../../components/configuracion/NotificadosVentasSection';
import { PagosConfigSection } from '../../components/configuracion/PagosConfigSection';
import { WhatsappBusinessSection } from '../../components/configuracion/WhatsappBusinessSection';

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin;

const BOT_TONES = [
  { key: 'FORMAL', label: 'Formal', desc: 'Profesional y respetuoso' },
  { key: 'AMIGABLE', label: 'Amigable', desc: 'Cercano y cálido' },
  { key: 'COSTEÑO', label: 'Costeño', desc: 'Descomplicado y alegre' },
];

function InstagramCard() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [feedback, setFeedback] = useState<string | null>(null);

  // Read result from OAuth callback redirect (?instagram=connected|error|...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const result = params.get('instagram');
    if (result === 'connected') setFeedback('✅ Instagram conectado exitosamente');
    else if (result === 'error') setFeedback('❌ Error al conectar. Intenta de nuevo.');
    else if (result === 'no_pages') setFeedback('⚠️ No se encontraron páginas de Facebook en tu cuenta.');
    else if (result === 'no_instagram_account') setFeedback('⚠️ Conecta una cuenta de Instagram Business a tu página de Facebook primero.');
    else if (result === 'cancelled') setFeedback(null);
  }, [location.search]);

  const { data: status, isLoading } = useQuery({
    queryKey: ['instagram-status'],
    queryFn: getInstagramStatus,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { url } = await getInstagramConnectUrl();
      window.location.href = url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectInstagram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-status'] });
      setFeedback('Instagram desconectado.');
    },
  });

  if (isLoading) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center text-white text-xl">
          📷
        </div>
        <div>
          <h2 className="text-white font-semibold">Instagram DMs</h2>
          <p className="text-slate-400 text-xs">Responde automáticamente los mensajes directos de tu Instagram</p>
        </div>
        {status?.connected && (
          <span className="ml-auto bg-green-900/40 text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-800">
            Conectado
          </span>
        )}
      </div>

      {feedback && (
        <p className="text-sm mb-4 text-slate-300">{feedback}</p>
      )}

      {status?.connected ? (
        <div className="space-y-3">
          <div className="bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-white text-sm font-medium">{status.pageName}</p>
              <p className="text-slate-500 text-xs">ID: {status.pageId}</p>
              {status.connectedAt && (
                <p className="text-slate-500 text-xs">
                  Conectado el {new Date(status.connectedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <p className="text-slate-400 text-xs">
            El bot responderá automáticamente todos los DMs que lleguen a tu Instagram Business.
          </p>
          <button
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="text-red-400 hover:text-red-300 text-sm underline transition-colors"
          >
            {disconnectMutation.isPending ? 'Desconectando...' : 'Desconectar Instagram'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">
            Conecta tu cuenta de Instagram Business para que el bot responda automáticamente a tus DMs — igual que WhatsApp.
          </p>
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">Requisitos:</p>
            <p>• Cuenta de Instagram Business (no personal)</p>
            <p>• Vinculada a una Página de Facebook</p>
          </div>
          <button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white font-semibold py-2.5 px-4 rounded-lg transition-opacity disabled:opacity-50 text-sm"
          >
            {connectMutation.isPending ? 'Redirigiendo a Instagram...' : 'Conectar Instagram →'}
          </button>
        </div>
      )}
    </div>
  );
}

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
    latitud: '',
    longitud: '',
    botName: '',
    botTone: 'AMIGABLE',
    ownerPhone: '',
  });

  const [copied, setCopied] = useState(false);
  const [hazloDesc, setHazloDesc] = useState('');
  const [hazloSent, setHazloSent] = useState(false);

  useEffect(() => {
    if (perfil) {
      setForm({
        descripcion: perfil.descripcion ?? '',
        horario: perfil.horario ?? '',
        logoUrl: perfil.logoUrl ?? '',
        direccion: perfil.direccion ?? '',
        ciudad: perfil.ciudad ?? '',
        latitud: perfil.latitud != null ? String(perfil.latitud) : '',
        longitud: perfil.longitud != null ? String(perfil.longitud) : '',
        botName: perfil.botName ?? '',
        botTone: perfil.botTone ?? 'AMIGABLE',
        ownerPhone: perfil.ownerPhone ?? '',
      });
    }
  }, [perfil]);

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: () =>
      actualizarPerfil({
        ...form,
        latitud: form.latitud !== '' ? parseFloat(form.latitud) : undefined,
        longitud: form.longitud !== '' ? parseFloat(form.longitud) : undefined,
        botName: form.botName || undefined,
        ownerPhone: form.ownerPhone || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mi-perfil'] });
    },
  });

  const { data: solicitudesHazlo } = useQuery({
    queryKey: ['hazlo-por-mi'],
    queryFn: getMisSolicitudesHazlo,
  });

  const { mutate: enviarHazlo, isPending: enviandoHazlo } = useMutation({
    mutationFn: () => crearSolicitudHazlo(hazloDesc),
    onSuccess: () => {
      setHazloSent(true);
      setHazloDesc('');
      void qc.invalidateQueries({ queryKey: ['hazlo-por-mi'] });
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
            WhatsApp del dueño
          </label>
          <input
            type="tel"
            value={form.ownerPhone}
            onChange={(e) => setForm((f) => ({ ...f, ownerPhone: e.target.value }))}
            placeholder="+57 300 123 4567"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Tu WhatsApp personal — el bot lo usa para identificarte cuando le escribes "resumen del día" o lo administras por voz.
          </p>
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">
              Ubicación en mapa (coordenadas)
            </label>
            <a
              href="https://www.openstreetmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Buscar coordenadas en OpenStreetMap ↗
            </a>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            Ej: Cali, Colombia → Latitud: 3.4516, Longitud: -76.5320
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Latitud</label>
              <input
                type="number"
                step="any"
                value={form.latitud}
                onChange={(e) => setForm((f) => ({ ...f, latitud: e.target.value }))}
                placeholder="3.4516"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Longitud</label>
              <input
                type="number"
                step="any"
                value={form.longitud}
                onChange={(e) => setForm((f) => ({ ...f, longitud: e.target.value }))}
                placeholder="-76.5320"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
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

      {/* Bot personality */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Personalidad del bot</h2>
          <p className="text-sm text-slate-500 mt-0.5">Cómo se presenta y comunica tu asistente con los clientes.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nombre del bot
          </label>
          <input
            type="text"
            value={form.botName}
            onChange={(e) => setForm((f) => ({ ...f, botName: e.target.value }))}
            placeholder="Ej: Sofía, Juanito, Asistente..."
            maxLength={30}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tono de comunicación
          </label>
          <div className="grid grid-cols-3 gap-3">
            {BOT_TONES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setForm((f) => ({ ...f, botTone: t.key }))}
                className={`border-2 rounded-xl p-3 text-left transition-colors ${
                  form.botTone === t.key
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className={`font-semibold text-sm ${form.botTone === t.key ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {t.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {isPending ? 'Guardando...' : 'Guardar personalidad'}
          </button>
        </div>
      </div>

      {/* WhatsApp Business del bot */}
      <WhatsappBusinessSection />

      {/* Notificaciones de ventas */}
      <NotificadosVentasSection />

      {/* Cobros del bot */}
      <PagosConfigSection />

      {/* Hazlo por mí */}
      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl shrink-0">🚀</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">¿Quieres que lo hagamos por ti?</h2>
            <p className="text-slate-400 text-sm mt-1 mb-4">
              Cuéntanos de tu negocio y nuestro equipo configura tu bot completo en 24-48 horas.
              Productos, flujos de venta, respuestas automáticas — todo listo.
            </p>

            {hazloSent ? (
              <div className="bg-green-900/50 border border-green-700 rounded-xl p-4 text-green-300 text-sm">
                ¡Solicitud enviada! Te escribiremos pronto al correo registrado.
              </div>
            ) : solicitudesHazlo && solicitudesHazlo.length > 0 ? (
              <div className="space-y-2">
                {solicitudesHazlo.map((s) => (
                  <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex items-center justify-between">
                    <p className="text-slate-300 text-sm truncate">{s.descripcion.slice(0, 60)}...</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-3 ${
                      s.status === 'DONE' ? 'bg-green-900 text-green-300' : 'bg-amber-900 text-amber-300'
                    }`}>
                      {s.status === 'DONE' ? 'Completado' : 'En proceso'}
                    </span>
                  </div>
                ))}
                <button
                  onClick={() => setHazloSent(false)}
                  className="text-indigo-400 hover:text-indigo-300 text-sm underline mt-2"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={hazloDesc}
                  onChange={(e) => setHazloDesc(e.target.value)}
                  placeholder="Ej: Tengo una peluquería en Medellín con 3 estilistas, ofrecemos corte, tinte y manicure. Quiero que el bot tome citas por WhatsApp y muestre precios..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => enviarHazlo()}
                  disabled={enviandoHazlo || hazloDesc.trim().length < 20}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {enviandoHazlo ? 'Enviando...' : 'Solicitar configuración →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Integraciones */}
        <InstagramCard />
      </div>
    </div>
  );
}
