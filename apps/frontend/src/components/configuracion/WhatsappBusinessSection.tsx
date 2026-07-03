import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getWhatsappStatus } from '../../api/perfil';

export function WhatsappBusinessSection() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: getWhatsappStatus,
  });
  const [copied, setCopied] = useState(false);

  if (isLoading || !status) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <p className="text-slate-500 text-sm">Cargando estado del WhatsApp...</p>
      </div>
    );
  }

  const copy = (txt: string) => {
    void navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (status.mode === 'PRODUCCION') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📱</span>
          <h2 className="text-lg font-semibold text-slate-800">WhatsApp Business del bot</h2>
          <span className="ml-auto bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
            🟢 Activo
          </span>
        </div>
        <p className="text-slate-500 text-sm mb-4">
          Este es el número desde el cual tu bot atiende. Compártelo con tus clientes.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <code className="text-green-800 font-mono font-bold text-lg flex-1">
            {status.botNumber}
          </code>
          <button
            onClick={() => copy(status.botNumber!)}
            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg shrink-0"
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          💡 Ponlo en tu bio de Instagram, página web, vitrina del local, factura, etc.
        </p>
      </div>
    );
  }

  // SANDBOX
  const fullActivacion = `join ${status.sandboxWord}`;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📱</span>
        <h2 className="text-lg font-semibold text-slate-800">WhatsApp Business del bot</h2>
        <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
          🟡 Modo prueba (sandbox)
        </span>
      </div>
      <p className="text-slate-600 text-sm mb-4">
        Estás en modo de prueba. El bot funciona pero usa el número compartido de Twilio.
        Para que un cliente pueda probarlo, debe primero <strong>autorizarse al sandbox</strong>:
      </p>

      <ol className="space-y-3 mb-5">
        <li className="flex items-start gap-3">
          <span className="bg-indigo-100 text-indigo-700 font-semibold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
            1
          </span>
          <div className="flex-1 text-sm text-slate-700">
            Abre WhatsApp y crea un chat nuevo con este número:
            <div className="mt-1.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
              <code className="text-slate-900 font-mono font-bold flex-1">
                {status.sandboxNumber}
              </code>
              <button
                onClick={() => copy(status.sandboxNumber!)}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline shrink-0"
              >
                Copiar
              </button>
            </div>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="bg-indigo-100 text-indigo-700 font-semibold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
            2
          </span>
          <div className="flex-1 text-sm text-slate-700">
            Envía exactamente este mensaje:
            <div className="mt-1.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
              <code className="text-slate-900 font-mono font-bold flex-1">
                {fullActivacion}
              </code>
              <button
                onClick={() => copy(fullActivacion)}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline shrink-0"
              >
                Copiar
              </button>
            </div>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="bg-indigo-100 text-indigo-700 font-semibold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
            3
          </span>
          <p className="flex-1 text-sm text-slate-700">
            Listo. Twilio responderá confirmando, y desde ese momento tu bot puede contestarte.
            Cada cliente tiene que repetir estos 3 pasos para probar el bot mientras estés en sandbox.
          </p>
        </li>
      </ol>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-sm text-indigo-900 font-semibold mb-1">
          🚀 ¿Quieres tu propio número?
        </p>
        <p className="text-xs text-indigo-800 mb-2">
          Cuando actives un plan pago, te asignamos un número de WhatsApp Business
          dedicado (ej: <code className="font-mono">+57 1 555 0100</code>) que puedes
          publicar libremente sin que tus clientes tengan que activarse.
        </p>
        <Link
          to="/mi-plan"
          className="text-indigo-700 hover:text-indigo-900 text-sm font-semibold underline"
        >
          Ver planes y activar →
        </Link>
      </div>
    </div>
  );
}
