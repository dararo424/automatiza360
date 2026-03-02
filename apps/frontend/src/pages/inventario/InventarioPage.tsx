import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlertas, ajustarStock } from '../../api/inventario';
import { getProductos } from '../../api/productos';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Producto } from '../../types';

function StockBar({ producto }: { producto: Producto }) {
  const isLow = producto.stock <= producto.minStock;
  const pct = producto.minStock > 0
    ? Math.min(100, Math.round((producto.stock / (producto.minStock * 2)) * 100))
    : 100;

  return (
    <div className="w-full bg-slate-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function AjusteForm({ producto, onClose }: { producto: Producto; onClose: () => void }) {
  const qc = useQueryClient();
  const [cantidad, setCantidad] = useState('');
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');

  const { mutate, isPending } = useMutation({
    mutationFn: () => ajustarStock(producto.id, { cantidad: Number(cantidad), tipo }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['productos'] });
      void qc.invalidateQueries({ queryKey: ['inventario-alertas'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800">Ajustar Stock</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          <span className="font-medium">{producto.name}</span> — Stock actual: <span className="font-bold">{producto.stock}</span>
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'ENTRADA' | 'SALIDA')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
          <button
            onClick={() => mutate()}
            disabled={isPending || !cantidad}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium"
          >
            {isPending ? 'Guardando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InventarioPage() {
  const [ajustando, setAjustando] = useState<Producto | null>(null);

  const { data: alertas = [], isLoading: loadingAlertas } = useQuery({
    queryKey: ['inventario-alertas'],
    queryFn: getAlertas,
  });

  const { data: productos = [], isLoading: loadingProductos } = useQuery({
    queryKey: ['productos'],
    queryFn: getProductos,
  });

  if (loadingAlertas || loadingProductos) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Alerts section */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-red-800 mb-3">
            ⚠️ Alertas de stock bajo ({alertas.length} producto{alertas.length !== 1 ? 's' : ''})
          </h2>
          <div className="space-y-2">
            {alertas.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700 font-medium">{p.name}</span>
                <span className="text-red-600">
                  Stock: <strong>{p.stock}</strong> / Mín: {p.minStock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full inventory */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">Inventario completo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Stock actual</th>
                <th className="px-4 py-3 font-medium">Stock mín.</th>
                <th className="px-4 py-3 font-medium w-48">Nivel</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">No hay productos</td>
                </tr>
              ) : (
                productos.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${p.stock <= p.minStock ? 'text-red-600' : 'text-slate-800'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.minStock}</td>
                    <td className="px-4 py-3">
                      <StockBar producto={p} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setAjustando(p)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Ajustar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {ajustando && <AjusteForm producto={ajustando} onClose={() => setAjustando(null)} />}
    </div>
  );
}
