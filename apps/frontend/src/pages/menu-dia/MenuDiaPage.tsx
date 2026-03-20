import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listarMenus,
  crearMenu,
  toggleMenuActivo,
  togglePlato,
  eliminarMenu,
  type MenuDia,
} from '../../api/menuDia';
import { getQrConfig } from '../../api/menuPublico';

function QrModal({ onClose }: { onClose: () => void }) {
  const { data: qrConfig, isLoading } = useQuery({
    queryKey: ['qr-config'],
    queryFn: getQrConfig,
  });

  const [copied, setCopied] = useState(false);

  function copyUrl() {
    if (qrConfig?.publicUrl) {
      navigator.clipboard.writeText(qrConfig.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm text-center">
        <h2 className="text-white font-bold text-lg mb-4">Código QR del Menú</h2>
        {isLoading ? (
          <p className="text-slate-400">Cargando...</p>
        ) : qrConfig ? (
          <>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrConfig.publicUrl)}`}
              alt="QR del menú"
              className="mx-auto rounded-lg mb-4 border border-slate-600"
              width={200}
              height={200}
            />
            <p className="text-slate-300 text-xs break-all mb-4 bg-slate-900/50 rounded p-2">{qrConfig.publicUrl}</p>
            <button
              onClick={copyUrl}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors mb-2"
            >
              {copied ? '¡Copiado!' : 'Copiar enlace'}
            </button>
          </>
        ) : (
          <p className="text-slate-400">No se pudo obtener el enlace</p>
        )}
        <button
          onClick={onClose}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function PlatoRow({ plato, onToggle }: { plato: any; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
      <div className="min-w-0">
        <span className={`text-sm font-medium ${plato.disponible ? 'text-white' : 'text-slate-500 line-through'}`}>
          {plato.name}
        </span>
        {plato.description && (
          <p className="text-xs text-slate-500 truncate">{plato.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span className="text-slate-300 text-sm">${plato.price.toLocaleString('es-CO')}</span>
        <button
          onClick={onToggle}
          className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
            plato.disponible
              ? 'bg-emerald-700 text-emerald-200 hover:bg-emerald-600'
              : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
          }`}
        >
          {plato.disponible ? 'Disponible' : 'Agotado'}
        </button>
      </div>
    </div>
  );
}

function NuevoPlatoForm({ onAdd }: { onAdd: (p: any) => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    onAdd({ name: name.trim(), description: desc.trim() || undefined, price: Number(price) });
    setName(''); setPrice(''); setDesc('');
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 mt-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del plato"
        className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
        required
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Descripción (opcional)"
        className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Precio"
        min={0}
        className="w-28 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
        required
      />
      <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        + Agregar
      </button>
    </form>
  );
}

export function MenuDiaPage() {
  const queryClient = useQueryClient();
  const [nuevosPlatos, setNuevosPlatos] = useState<any[]>([]);
  const [creando, setCreando] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const { data: menus = [], isLoading } = useQuery({
    queryKey: ['menus-dia'],
    queryFn: listarMenus,
  });

  const crearMutation = useMutation({
    mutationFn: (platos: any[]) => crearMenu(platos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus-dia'] });
      setNuevosPlatos([]);
      setCreando(false);
    },
  });

  const toggleMenuMutation = useMutation({
    mutationFn: (id: string) => toggleMenuActivo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menus-dia'] }),
  });

  const togglePlatoMutation = useMutation({
    mutationFn: (platoId: string) => togglePlato(platoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menus-dia'] }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarMenu(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menus-dia'] }),
  });

  const menuHoy = menus.find((m: MenuDia) => {
    const hoy = new Date().toDateString();
    return new Date(m.fecha).toDateString() === hoy;
  });

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {showQr && <QrModal onClose={() => setShowQr(false)} />}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Menú del Día</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQr(true)}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Ver QR
          </button>
        {!creando && !menuHoy && (
          <button
            onClick={() => setCreando(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Crear menú de hoy
          </button>
        )}
        </div>
      </div>

      {/* Formulario crear menú */}
      {creando && (
        <div className="bg-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-3">Nuevo menú de hoy</h2>
          <div className="space-y-1">
            {nuevosPlatos.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-sm bg-slate-700 rounded-lg px-3 py-2">
                <span className="text-white">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">${p.price.toLocaleString('es-CO')}</span>
                  <button
                    onClick={() => setNuevosPlatos((prev) => prev.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <NuevoPlatoForm onAdd={(p) => setNuevosPlatos((prev) => [...prev, p])} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => crearMutation.mutate(nuevosPlatos)}
              disabled={nuevosPlatos.length === 0 || crearMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {crearMutation.isPending ? 'Guardando...' : 'Publicar menú'}
            </button>
            <button
              onClick={() => { setCreando(false); setNuevosPlatos([]); }}
              className="text-slate-400 hover:text-white text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-400">Cargando...</div>
      ) : menus.length === 0 && !creando ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">🍽️</p>
          <p>No hay menús creados aún</p>
          <button
            onClick={() => setCreando(true)}
            className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Crear primer menú
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu: MenuDia) => (
            <div key={menu.id} className="bg-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <h2 className="text-white font-semibold">
                    {new Date(menu.fecha).toLocaleDateString('es-CO', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${menu.activo ? 'bg-emerald-700 text-emerald-200' : 'bg-slate-600 text-slate-400'}`}>
                    {menu.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleMenuMutation.mutate(menu.id)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded"
                  >
                    {menu.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este menú?')) eliminarMutation.mutate(menu.id);
                    }}
                    className="text-xs bg-red-800 hover:bg-red-700 text-red-200 px-2 py-1 rounded"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div>
                {menu.platos.length === 0 ? (
                  <p className="text-slate-500 text-sm">Sin platos</p>
                ) : (
                  menu.platos.map((plato) => (
                    <PlatoRow
                      key={plato.id}
                      plato={plato}
                      onToggle={() => togglePlatoMutation.mutate(plato.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
