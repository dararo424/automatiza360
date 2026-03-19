import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getApiKeys, createApiKey, revokeApiKey, type ApiKey } from '../../api/apiKeys';
import { UpgradePrompt } from '../../components/common/UpgradePrompt';

export function ApiKeysPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const plan = user?.tenant?.subscriptionPlan || user?.tenant?.plan || 'STARTER';
  const canUse = plan === 'BUSINESS';

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: getApiKeys,
    enabled: canUse,
  });

  const createMutation = useMutation({
    mutationFn: () => createApiKey(name),
    onSuccess: (data) => {
      setNewKey(data.rawKey);
      setName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  if (!canUse) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold text-white mb-6">API Keys</h1>
        <UpgradePrompt
          feature="API Keys"
          requiredPlan="BUSINESS"
          description="Las API keys permiten integrar Automatiza360 con tus propios sistemas y aplicaciones externas."
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">API Keys</h1>
      <p className="text-slate-400 text-sm mb-6">
        Genera claves para integrar tu sistema con la API de Automatiza360.
      </p>

      {/* Nueva key */}
      {newKey && (
        <div className="bg-emerald-900/40 border border-emerald-700 rounded-xl p-4 mb-6">
          <p className="text-emerald-300 font-semibold mb-1">✓ API key creada</p>
          <p className="text-emerald-200 text-xs mb-2">Copia esta clave ahora — no se volverá a mostrar.</p>
          <div className="flex gap-2 items-center">
            <code className="flex-1 bg-slate-900 text-emerald-300 px-3 py-2 rounded text-xs font-mono break-all">
              {newKey}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(newKey); }}
              className="shrink-0 text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded"
            >
              Copiar
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-slate-400 hover:text-white">
            Cerrar
          </button>
        </div>
      )}

      {/* Crear */}
      <div className="bg-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-3">Nueva API key</h2>
        <div className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la key (ej: Integración ERP)"
            className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name || createMutation.isPending}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {createMutation.isPending ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-slate-400">Cargando...</div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No hay API keys creadas</div>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-700/50">
            {apiKeys.map((k: ApiKey) => (
              <div key={k.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{k.name}</p>
                  <code className="text-slate-400 text-xs font-mono">{k.keyPrefix}...</code>
                  {k.lastUsed && (
                    <p className="text-slate-500 text-xs">
                      Último uso: {new Date(k.lastUsed).toLocaleDateString('es-CO')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${k.active ? 'bg-emerald-700 text-emerald-200' : 'bg-slate-600 text-slate-400'}`}>
                    {k.active ? 'Activa' : 'Revocada'}
                  </span>
                  {k.active && (
                    <button
                      onClick={() => { if (confirm('¿Revocar esta API key?')) revokeMutation.mutate(k.id); }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Revocar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
