import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlertas, ajustarStock } from '../../api/inventario';
import { getProductos, crearProducto } from '../../api/productos';
import { importarInventario } from '../../api/aiService';
import { importarCatalogo, getProveedores, getProductosProveedor } from '../../api/proveedores';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { ImportedProduct, Producto, Proveedor, ProveedorProducto } from '../../types';

// ─── StockBar ────────────────────────────────────────────────────────────────

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

// ─── AjusteForm ───────────────────────────────────────────────────────────────

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
          <span className="font-medium">{producto.name}</span> — Stock actual:{' '}
          <span className="font-bold">{producto.stock}</span>
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

// ─── ProveedorProductosModal ──────────────────────────────────────────────────

function ProveedorProductosModal({
  proveedor,
  onClose,
}: {
  proveedor: Proveedor;
  onClose: () => void;
}) {
  const { data: productos = [], isLoading } = useQuery<ProveedorProducto[]>({
    queryKey: ['proveedor-productos', proveedor.id],
    queryFn: () => getProductosProveedor(proveedor.id),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{proveedor.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{proveedor._count.products} productos en catálogo</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : productos.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-sm">Sin productos</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium text-right">Costo</th>
                  <th className="px-4 py-3 font-medium text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {p.name}
                      {p.description && (
                        <span className="block text-xs text-slate-400 font-normal">{p.description}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.sku ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${p.cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-800 font-medium">${p.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ImportarModal ────────────────────────────────────────────────────────────

type ImportMode = 'inventario' | 'catalogo';

function ImportarModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'extracting' | 'preview'>('upload');
  const [products, setProducts] = useState<ImportedProduct[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [manualSupplier, setManualSupplier] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('inventario');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setStep('extracting');
    try {
      const result = await importarInventario(file);
      if (result.products.length === 0) {
        setStep('preview');
        setProducts([]);
        setSelected([]);
        setSupplierName(result.supplierName);
        setError('No se detectaron productos en el archivo.');
      } else {
        setProducts(result.products);
        setSelected(result.products.map(() => true));
        setSupplierName(result.supplierName);
        setStep('preview');
      }
    } catch {
      setError('Error al analizar el archivo. Intenta de nuevo.');
      setStep('upload');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function toggleRow(i: number) {
    setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  async function handleImport() {
    setImporting(true);
    const toCreate = products.filter((_, i) => selected[i]);
    try {
      if (importMode === 'catalogo') {
        const name = (supplierName ?? manualSupplier).trim();
        await importarCatalogo(name, toCreate);
        void qc.invalidateQueries({ queryKey: ['proveedores'] });
      } else {
        for (const p of toCreate) {
          await crearProducto({ ...p, stock: p.stock ?? 0, minStock: p.minStock ?? 0 });
        }
        void qc.invalidateQueries({ queryKey: ['productos'] });
        void qc.invalidateQueries({ queryKey: ['inventario-alertas'] });
      }
      onClose();
    } catch {
      setError('Error al importar. Intenta de nuevo.');
    } finally {
      setImporting(false);
    }
  }

  const selectedCount = selected.filter(Boolean).length;
  const resolvedSupplier = supplierName ?? manualSupplier.trim();
  const canImport =
    selectedCount > 0 &&
    (importMode === 'inventario' || resolvedSupplier.length >= 2);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800">Importar lista de precios</h3>
          {step !== 'extracting' && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Sube un archivo Excel o PDF con tu lista de precios y la IA extraerá los productos automáticamente.
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <p className="text-slate-500 text-sm">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                <p className="text-slate-400 text-xs mt-1">PDF, Excel (.xlsx, .xls), JPG, PNG — máx. 20 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}

          {step === 'extracting' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <LoadingSpinner />
              <p className="text-sm text-slate-600">Analizando archivo con IA...</p>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Supplier badge */}
              {supplierName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Proveedor detectado:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {supplierName}
                  </span>
                </div>
              )}

              {/* Import mode toggle */}
              {products.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">¿Cómo importar?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setImportMode('inventario')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        importMode === 'inventario'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      Inventario propio
                    </button>
                    <button
                      onClick={() => setImportMode('catalogo')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        importMode === 'catalogo'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      Catálogo de proveedor
                    </button>
                  </div>
                </div>
              )}

              {/* Manual supplier name input */}
              {importMode === 'catalogo' && !supplierName && products.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre del proveedor
                  </label>
                  <input
                    type="text"
                    value={manualSupplier}
                    onChange={(e) => setManualSupplier(e.target.value)}
                    placeholder="Ej: Distribuidora Electrónica SA"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              {products.length > 0 && (
                <>
                  <p className="text-sm text-slate-600">
                    Se detectaron <strong>{products.length}</strong> productos. Selecciona los que deseas importar.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-200">
                          <th className="px-3 py-2 w-8">
                            <input
                              type="checkbox"
                              checked={selected.every(Boolean)}
                              onChange={(e) => setSelected(selected.map(() => e.target.checked))}
                            />
                          </th>
                          <th className="px-3 py-2 font-medium">Nombre</th>
                          <th className="px-3 py-2 font-medium">SKU</th>
                          <th className="px-3 py-2 font-medium text-right">Precio</th>
                          <th className="px-3 py-2 font-medium text-right">Costo</th>
                          {importMode === 'inventario' && (
                            <>
                              <th className="px-3 py-2 font-medium text-right">Stock</th>
                              <th className="px-3 py-2 font-medium text-right">Stock mín</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p, i) => (
                          <tr
                            key={i}
                            className={`border-b border-slate-100 cursor-pointer ${selected[i] ? '' : 'opacity-40'}`}
                            onClick={() => toggleRow(i)}
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selected[i]}
                                onChange={() => toggleRow(i)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-800">
                              {p.name}
                              {p.description && (
                                <span className="block text-xs text-slate-400 font-normal">{p.description}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-500 font-mono text-xs">{p.sku ?? '—'}</td>
                            <td className="px-3 py-2 text-right text-slate-800">${p.price.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-slate-500">
                              {p.cost != null ? `$${p.cost.toFixed(2)}` : '—'}
                            </td>
                            {importMode === 'inventario' && (
                              <>
                                <td className="px-3 py-2 text-right text-slate-800">{p.stock ?? 0}</td>
                                <td className="px-3 py-2 text-right text-slate-500">{p.minStock ?? 0}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && products.length > 0 && (
          <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
              Cancelar
            </button>
            <button
              onClick={() => void handleImport()}
              disabled={importing || !canImport}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium"
            >
              {importing
                ? 'Importando...'
                : importMode === 'catalogo'
                ? `Guardar catálogo (${selectedCount} producto${selectedCount !== 1 ? 's' : ''})`
                : `Importar ${selectedCount} producto${selectedCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TablaProveedores ─────────────────────────────────────────────────────────

function TablaProveedores() {
  const [verProductos, setVerProductos] = useState<Proveedor | null>(null);

  const { data: proveedores = [], isLoading } = useQuery<Proveedor[]>({
    queryKey: ['proveedores'],
    queryFn: getProveedores,
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Productos en catálogo</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {proveedores.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-slate-400">
                  No hay proveedores. Importa una lista de precios como "Catálogo de proveedor".
                </td>
              </tr>
            ) : (
              proveedores.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p._count.products}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setVerProductos(p)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Ver productos
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {verProductos && (
        <ProveedorProductosModal proveedor={verProductos} onClose={() => setVerProductos(null)} />
      )}
    </>
  );
}

// ─── InventarioPage ───────────────────────────────────────────────────────────

type Tab = 'inventario' | 'proveedores';

export function InventarioPage() {
  const [tab, setTab] = useState<Tab>('inventario');
  const [ajustando, setAjustando] = useState<Producto | null>(null);
  const [showImportar, setShowImportar] = useState(false);

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
      {/* Stock alerts */}
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

      {/* Main card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {/* Tab header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setTab('inventario')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'inventario'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Inventario completo
            </button>
            <button
              onClick={() => setTab('proveedores')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'proveedores'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Proveedores
            </button>
          </div>
          <button
            onClick={() => setShowImportar(true)}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Importar lista de precios
          </button>
        </div>

        {/* Tab content */}
        {tab === 'inventario' ? (
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
        ) : (
          <TablaProveedores />
        )}
      </div>

      {ajustando && <AjusteForm producto={ajustando} onClose={() => setAjustando(null)} />}
      {showImportar && <ImportarModal onClose={() => setShowImportar(false)} />}
    </div>
  );
}
