import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrdenes, cambiarEstadoOrden, getLinkPago, enviarLinkPagoWhatsApp } from '../../api/ordenes';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Orden, OrderStatus } from '../../types';

const ESTADOS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'PREPARING', label: 'Preparando' },
  { value: 'READY', label: 'Listo' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

function PagarBtn({ orden }: { orden: Orden }) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const noActiva = orden.status === 'DELIVERED' || orden.status === 'CANCELLED';
  if (noActiva) return null;

  const handleVer = async () => {
    setLoading(true);
    try {
      const { url } = await getLinkPago(orden.id);
      window.open(url, '_blank');
    } catch {
      alert('No se pudo generar el link de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarWA = async () => {
    if (!orden.phone) {
      setFeedback('La orden no tiene teléfono');
      setTimeout(() => setFeedback(null), 2500);
      return;
    }
    setSending(true);
    try {
      const result = await enviarLinkPagoWhatsApp(orden.id);
      if (result.ok) {
        setFeedback(`✓ Enviado a ${result.sentTo}`);
      } else {
        setFeedback(`✗ ${result.reason}`);
      }
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('✗ Error de red');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => void handleVer()}
        disabled={loading}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-60"
        title="Ver link de pago"
      >
        {loading ? '...' : '💳 Pagar'}
      </button>
      {orden.phone && (
        <button
          onClick={() => void handleEnviarWA()}
          disabled={sending}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-60"
          title="Enviar link al cliente por WhatsApp"
        >
          {sending ? '...' : '📲 Enviar'}
        </button>
      )}
      {feedback && (
        <span className="text-xs text-slate-600 truncate max-w-[160px]">{feedback}</span>
      )}
    </div>
  );
}

function OrdenModal({ orden, onClose }: { orden: Orden; onClose: () => void }) {
  const qc = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: ({ estado }: { estado: OrderStatus }) => cambiarEstadoOrden(orden.id, estado),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ordenes'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Orden #{orden.number}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Badge status={orden.status} type="order" />
          {orden.phone && <span className="text-sm text-slate-500">📞 {orden.phone}</span>}
        </div>
        {orden.notes && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded p-3 mb-4">{orden.notes}</p>
        )}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="text-left border-b border-slate-200">
              <th className="pb-2 font-medium text-slate-600">Producto</th>
              <th className="pb-2 font-medium text-slate-600 text-center">Cant.</th>
              <th className="pb-2 font-medium text-slate-600 text-right">Precio</th>
            </tr>
          </thead>
          <tbody>
            {orden.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-50">
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="pt-3 font-semibold text-slate-700">Total</td>
              <td className="pt-3 text-right font-bold text-lg text-slate-800">${orden.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <div className="flex items-center gap-2 pt-2">
          <select
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            defaultValue={orden.status}
            onChange={(e) => mutate({ estado: e.target.value as OrderStatus })}
            disabled={isPending}
          >
            {ESTADOS.filter((e) => e.value !== '').map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function downloadCsv(url: string, filename: string) {
  const token = localStorage.getItem('token');
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const blob = await resp.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function OrdenesPage() {
  const [estado, setEstado] = useState<OrderStatus | ''>('');
  const [selected, setSelected] = useState<Orden | null>(null);

  const { data: ordenes = [], isLoading } = useQuery({
    queryKey: ['ordenes', estado],
    queryFn: () => getOrdenes(estado || undefined),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as OrderStatus | '')}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <button
          onClick={() => downloadCsv(`${API_BASE}/ordenes/exportar`, 'ordenes.csv')}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm rounded-lg transition-colors"
        >
          ⬇ Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {isLoading ? (
          <div className="h-64"><LoadingSpinner /></div>
        ) : ordenes.length === 0 ? (
          <p className="px-4 py-10 text-center text-slate-400 text-sm">No hay órdenes</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Teléfono</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelected(o)}
                    >
                      <td className="px-4 py-3 font-mono font-medium">#{o.number}</td>
                      <td className="px-4 py-3 text-slate-600">{o.phone ?? '—'}</td>
                      <td className="px-4 py-3"><Badge status={o.status} type="order" /></td>
                      <td className="px-4 py-3 font-medium">${o.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString('es')}</td>
                      <td className="px-4 py-3"><PagarBtn orden={o} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {ordenes.map((o) => (
                <button
                  key={o.id}
                  className="w-full text-left px-4 py-3 space-y-1.5 hover:bg-slate-50 active:bg-slate-100"
                  onClick={() => setSelected(o)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-slate-800 text-sm">#{o.number}</span>
                    <Badge status={o.status} type="order" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{o.phone ?? '—'}</span>
                    <span>{new Date(o.createdAt).toLocaleDateString('es')}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">${o.total.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {selected && <OrdenModal orden={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
