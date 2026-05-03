import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  actualizarPagosConfig,
  getPagosConfig,
  type PaymentMode,
} from '../../api/pagos-config';

const MODES: { value: PaymentMode; title: string; desc: string; emoji: string }[] = [
  {
    value: 'MANUAL',
    emoji: '🤝',
    title: 'Manual',
    desc: 'El bot solo genera la cotización. Tu equipo contacta al cliente para coordinar el pago.',
  },
  {
    value: 'TEXT',
    emoji: '💬',
    title: 'Texto personalizado',
    desc: 'El bot envía un mensaje predefinido (ej: datos de cuenta bancaria) al cliente.',
  },
  {
    value: 'WOMPI',
    emoji: '💳',
    title: 'Wompi automático',
    desc: 'El bot envía un link Wompi seguro. El cliente paga con tarjeta, Nequi, Daviplata o PSE. La cotización se marca como pagada al confirmarse.',
  },
];

export function PagosConfigSection() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ['pagos-config'],
    queryFn: getPagosConfig,
  });

  const [mode, setMode] = useState<PaymentMode>('MANUAL');
  const [paymentText, setPaymentText] = useState('');
  const [wompiPublicKey, setWompiPublicKey] = useState('');
  const [wompiIntegritySecret, setWompiIntegritySecret] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (config) {
      setMode(config.paymentMode);
      setPaymentText(config.paymentText ?? '');
      setWompiPublicKey(config.wompiPublicKey ?? '');
    }
  }, [config]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload: any = {
        paymentMode: mode,
        paymentText: mode === 'TEXT' ? paymentText : undefined,
        wompiPublicKey: mode === 'WOMPI' ? wompiPublicKey : undefined,
      };
      if (mode === 'WOMPI' && wompiIntegritySecret.trim()) {
        payload.wompiIntegritySecret = wompiIntegritySecret;
      }
      return actualizarPagosConfig(payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pagos-config'] });
      setWompiIntegritySecret('');
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    },
  });

  if (isLoading || !config) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <p className="text-slate-500 text-sm">Cargando configuración de pagos...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white">Cobros del bot</h2>
      <p className="text-slate-400 text-sm mb-5">
        Define cómo el bot le pide al cliente que pague una vez confirmada la cotización.
      </p>

      <div className="space-y-3 mb-5">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={`w-full text-left border-2 rounded-xl p-4 transition-colors ${
              mode === m.value
                ? 'border-indigo-500 bg-indigo-950/40'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{m.emoji}</span>
              <div>
                <p
                  className={`font-semibold text-sm ${
                    mode === m.value ? 'text-indigo-300' : 'text-slate-200'
                  }`}
                >
                  {m.title}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">{m.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {mode === 'TEXT' && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-5">
          <label className="block text-sm font-medium text-slate-200 mb-2">
            Mensaje que recibirá el cliente
          </label>
          <textarea
            rows={4}
            value={paymentText}
            onChange={(e) => setPaymentText(e.target.value)}
            placeholder="Ej: Para confirmar tu pedido, transfiere a Bancolombia ahorros 12345-678 a nombre de Relojería SERRAT y envía el comprobante a este chat."
            maxLength={500}
            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2"
          />
          <p className="text-xs text-slate-500 mt-1">
            {paymentText.length}/500 caracteres. Se enviará al cliente justo después de la cotización.
          </p>
        </div>
      )}

      {mode === 'WOMPI' && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Wompi Public Key
            </label>
            <input
              type="text"
              value={wompiPublicKey}
              onChange={(e) => setWompiPublicKey(e.target.value)}
              placeholder="pub_prod_xxxxxxxxxxxxxxxx"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Wompi Integrity Secret
              {config.wompiIntegritySecretConfigured && (
                <span className="ml-2 text-xs text-green-400">✓ ya configurado</span>
              )}
            </label>
            <input
              type="password"
              value={wompiIntegritySecret}
              onChange={(e) => setWompiIntegritySecret(e.target.value)}
              placeholder={
                config.wompiIntegritySecretConfigured
                  ? '•••••••••••• (deja vacío para mantenerlo)'
                  : 'Tu integrity secret de Wompi'
              }
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono rounded-lg px-3 py-2"
            />
            <p className="text-xs text-slate-500 mt-1">
              Lo encuentras en Wompi → Comerciantes → Tu cuenta → Configuración → Integrity.
            </p>
          </div>
          <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-3 text-xs text-amber-200">
            ⚠️ Los pagos van directo a tu cuenta Wompi. Asegúrate de tener una cuenta de
            comerciante aprobada en producción antes de activar este modo.
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar configuración'}
        </button>
        {savedFlash && (
          <span className="text-sm text-green-400 font-medium">✓ Guardado</span>
        )}
      </div>
    </div>
  );
}
