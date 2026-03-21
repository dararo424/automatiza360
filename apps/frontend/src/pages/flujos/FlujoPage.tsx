import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFlujos, updateFlujos } from '../../api/flujos';


export function FlujoPage() {
  const queryClient = useQueryClient();
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [guardado, setGuardado] = useState(false);

  const { data: flujoInfo, isLoading } = useQuery({
    queryKey: ['flujos'],
    queryFn: getFlujos,
  });

  useEffect(() => {
    if (flujoInfo) {
      setSeleccionados(flujoInfo.activos);
    }
  }, [flujoInfo]);

  const mutation = useMutation({
    mutationFn: updateFlujos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flujos'] });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    },
  });

  function toggleFlujo(id: string) {
    if (!flujoInfo) return;
    const limite = flujoInfo.limite;
    if (seleccionados.includes(id)) {
      setSeleccionados((prev) => prev.filter((f) => f !== id));
    } else {
      if (seleccionados.length >= limite) return;
      setSeleccionados((prev) => [...prev, id]);
    }
  }

  if (isLoading || !flujoInfo) {
    return <div className="p-8 text-slate-400">Cargando flujos...</div>;
  }

  const limite = flujoInfo.limite;
  const planLabel = flujoInfo.plan;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Flujos de WhatsApp activos</h1>
      <p className="text-slate-400 mb-6">
        Selecciona los flujos que quieres activar según tu plan{' '}
        <span className="text-indigo-400 font-semibold">({planLabel}: {limite} flujo{limite !== 1 ? 's' : ''} disponible{limite !== 1 ? 's' : ''})</span>
      </p>

      {/* Progress bar */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-300 font-medium">{seleccionados.length} de {limite} flujos activados</span>
          <span className="text-slate-400">{Math.round((seleccionados.length / limite) * 100)}%</span>
        </div>
        <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (seleccionados.length / limite) * 100)}%` }}
          />
        </div>
      </div>

      {/* Flujo cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {flujoInfo.disponibles.map((flujo) => {
          const activo = seleccionados.includes(flujo.id);
          const bloqueado = !activo && seleccionados.length >= limite;

          return (
            <button
              key={flujo.id}
              type="button"
              onClick={() => toggleFlujo(flujo.id)}
              disabled={bloqueado}
              className={[
                'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                activo
                  ? 'border-indigo-500 bg-indigo-900/40 shadow-lg shadow-indigo-500/10'
                  : bloqueado
                  ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-750 cursor-pointer',
              ].join(' ')}
            >
              {bloqueado && (
                <span className="absolute top-3 right-3 text-slate-500">🔒</span>
              )}
              {activo && (
                <span className="absolute top-3 right-3 text-indigo-400 font-bold text-sm">✓</span>
              )}
              <div className="text-3xl mb-2">{flujo.emoji}</div>
              <div className={`font-semibold text-sm mb-1 ${activo ? 'text-indigo-200' : 'text-slate-200'}`}>
                {flujo.nombre}
              </div>
              <div className="text-xs text-slate-400">{flujo.descripcion}</div>
            </button>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => mutation.mutate(seleccionados)}
          disabled={mutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {guardado && (
          <span className="text-emerald-400 text-sm font-medium">✓ Guardado correctamente</span>
        )}
        {mutation.isError && (
          <span className="text-red-400 text-sm">
            {(mutation.error as any)?.response?.data?.message ?? 'Error al guardar'}
          </span>
        )}
      </div>

      {flujoInfo.plan === 'STARTER' && (
        <p className="mt-4 text-slate-500 text-sm">
          Con el plan <span className="text-indigo-400">Pro</span> puedes activar hasta 4 flujos,
          y con <span className="text-amber-400">Business</span> los 6 flujos sin límites.
        </p>
      )}
    </div>
  );
}
