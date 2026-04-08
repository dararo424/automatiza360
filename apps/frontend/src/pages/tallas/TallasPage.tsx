import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTallasConfig,
  getHistorialTallas,
  uploadTallasFile,
  sincronizarGoogleSheets,
  type TallaConfig,
  type TallaConsulta,
} from '../../api/tallas';

const CONFIANZA_COLOR: Record<string, string> = {
  ALTA: 'text-emerald-400',
  MEDIA: 'text-yellow-400',
  BAJA: 'text-red-400',
};

const CONFIANZA_LABEL: Record<string, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
};

function formatPhone(phone: string) {
  return `****${phone.slice(-4)}`;
}

function CargarTablaSection() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [resultado, setResultado] = useState<{ importadas: number } | null>(null);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (file: File) => uploadTallasFile(file),
    onSuccess: (data) => {
      setResultado(data);
      setError('');
      qc.invalidateQueries({ queryKey: ['tallas-config'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Error al procesar el archivo.');
    },
  });

  const handleFile = (file: File) => {
    setResultado(null);
    setError('');
    mutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-5">
      <h2 className="text-white font-bold mb-1">Cargar tabla de tallas</h2>
      <p className="text-slate-400 text-sm mb-4">
        Sube un archivo Excel o CSV con las columnas:{' '}
        <code className="text-indigo-300 text-xs">
          Talla, Altura_min, Altura_max, Peso_min, Peso_max, Cintura_min, Cintura_max
        </code>
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-indigo-400 bg-indigo-900/20' : 'border-slate-600 hover:border-slate-500'
        }`}
      >
        <p className="text-3xl mb-2">📂</p>
        <p className="text-slate-300 text-sm font-medium">
          {mutation.isPending ? 'Procesando...' : 'Arrastra tu archivo aquí o haz clic para seleccionar'}
        </p>
        <p className="text-slate-500 text-xs mt-1">.xlsx, .xls o .csv</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        className="hidden"
      />

      {error && (
        <div className="mt-3 bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {resultado && (
        <div className="mt-3 bg-emerald-900/40 border border-emerald-700 rounded-lg px-4 py-3 text-emerald-300 text-sm">
          Se importaron <span className="font-bold">{resultado.importadas}</span> tallas correctamente.
        </div>
      )}
    </div>
  );
}

function SincronizarSheetsSection() {
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [resultado, setResultado] = useState<{ importadas: number } | null>(null);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => sincronizarGoogleSheets(url),
    onSuccess: (data) => {
      setResultado(data);
      setError('');
      qc.invalidateQueries({ queryKey: ['tallas-config'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Error al sincronizar.');
    },
  });

  return (
    <div className="bg-slate-800 rounded-xl p-5">
      <h2 className="text-white font-bold mb-1">Sincronizar desde Google Sheets</h2>
      <p className="text-slate-400 text-sm mb-4">
        El Sheet debe ser público y tener las mismas columnas que el Excel.
      </p>
      <div className="flex gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!url || mutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {mutation.isPending ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>
      {error && (
        <div className="mt-3 bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}
      {resultado && (
        <div className="mt-3 bg-emerald-900/40 border border-emerald-700 rounded-lg px-4 py-3 text-emerald-300 text-sm">
          Sincronizadas <span className="font-bold">{resultado.importadas}</span> tallas desde Google Sheets.
        </div>
      )}
    </div>
  );
}

function TablaTallasSection({ configs }: { configs: TallaConfig[] }) {
  if (configs.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <p className="text-3xl mb-3">📏</p>
        <p className="text-slate-400">No hay tabla de tallas configurada.</p>
        <p className="text-slate-500 text-sm mt-1">Carga un archivo o sincroniza un Google Sheet para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700">
        <h2 className="text-white font-bold">Tabla de tallas actual</h2>
        <p className="text-slate-400 text-sm">{configs.length} tallas configuradas</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Talla</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Altura (cm)</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Peso (kg)</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Cintura (cm)</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((c) => (
              <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-3">
                  <span className="bg-indigo-700 text-white font-bold px-2 py-0.5 rounded text-xs">
                    {c.talla}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {c.alturaMin} – {c.alturaMax}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {c.pesoMin} – {c.pesoMax}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {c.cinturaMin} – {c.cinturaMax}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistorialSection({ consultas, totalMes }: { consultas: TallaConsulta[]; totalMes: number }) {
  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold">Historial de consultas del bot</h2>
          <p className="text-slate-400 text-sm">Últimas 100 consultas</p>
        </div>
        <div className="bg-indigo-900/50 border border-indigo-700 rounded-lg px-4 py-2 text-center">
          <p className="text-indigo-300 text-2xl font-bold">{totalMes}</p>
          <p className="text-indigo-400 text-xs">este mes</p>
        </div>
      </div>
      {consultas.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-slate-400">Aún no hay consultas de talla por WhatsApp.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Fecha</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Teléfono</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Altura</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Peso</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Cintura</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Talla</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium">Confianza</th>
              </tr>
            </thead>
            <tbody>
              {consultas.map((c) => (
                <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString('es-CO', { dateStyle: 'short' })}{' '}
                    {new Date(c.createdAt).toLocaleTimeString('es-CO', { timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                    {formatPhone(c.clientePhone)}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{c.altura} cm</td>
                  <td className="px-4 py-3 text-slate-300">{c.peso} kg</td>
                  <td className="px-4 py-3 text-slate-300">
                    {c.cintura != null ? `${c.cintura} cm` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-indigo-700 text-white font-bold px-2 py-0.5 rounded text-xs">
                      {c.tallaRecomendada}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold text-xs ${CONFIANZA_COLOR[c.confianza] ?? 'text-slate-400'}`}>
                    {CONFIANZA_LABEL[c.confianza] ?? c.confianza}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function TallasPage() {
  const { data: configs = [], isLoading: loadingConfig } = useQuery({
    queryKey: ['tallas-config'],
    queryFn: getTallasConfig,
  });

  const { data: historial, isLoading: loadingHistorial } = useQuery({
    queryKey: ['tallas-historial'],
    queryFn: getHistorialTallas,
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tallas</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configura la guía de tallas para que el bot de WhatsApp ayude a tus clientes a elegir la talla correcta.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <CargarTablaSection />
        <SincronizarSheetsSection />
      </div>

      {loadingConfig ? (
        <div className="text-slate-400 text-center py-8">Cargando tabla...</div>
      ) : (
        <TablaTallasSection configs={configs} />
      )}

      {loadingHistorial ? (
        <div className="text-slate-400 text-center py-8">Cargando historial...</div>
      ) : historial ? (
        <HistorialSection consultas={historial.consultas} totalMes={historial.totalMes} />
      ) : null}
    </div>
  );
}
