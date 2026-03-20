import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getContactos,
  upsertContacto,
  actualizarContacto,
  eliminarContacto,
  canjearPuntos,
  type Contacto,
} from '../../api/contactos';

const PAISES = [
  { nombre: 'Colombia', codigo: 'CO', prefijo: '+57' },
  { nombre: 'México', codigo: 'MX', prefijo: '+52' },
  { nombre: 'Argentina', codigo: 'AR', prefijo: '+54' },
  { nombre: 'Chile', codigo: 'CL', prefijo: '+56' },
  { nombre: 'Perú', codigo: 'PE', prefijo: '+51' },
  { nombre: 'Ecuador', codigo: 'EC', prefijo: '+593' },
  { nombre: 'Venezuela', codigo: 'VE', prefijo: '+58' },
  { nombre: 'Bolivia', codigo: 'BO', prefijo: '+591' },
  { nombre: 'Paraguay', codigo: 'PY', prefijo: '+595' },
  { nombre: 'Uruguay', codigo: 'UY', prefijo: '+598' },
  { nombre: 'Costa Rica', codigo: 'CR', prefijo: '+506' },
  { nombre: 'Panamá', codigo: 'PA', prefijo: '+507' },
  { nombre: 'Guatemala', codigo: 'GT', prefijo: '+502' },
  { nombre: 'Honduras', codigo: 'HN', prefijo: '+504' },
  { nombre: 'El Salvador', codigo: 'SV', prefijo: '+503' },
  { nombre: 'República Dominicana', codigo: 'DO', prefijo: '+1809' },
  { nombre: 'España', codigo: 'ES', prefijo: '+34' },
  { nombre: 'Estados Unidos', codigo: 'US', prefijo: '+1' },
];

function CanjearModal({ contacto, onClose }: { contacto: Contacto; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [puntos, setPuntos] = useState('');

  const mutation = useMutation({
    mutationFn: () => canjearPuntos(contacto.id, Number(puntos)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-white font-bold mb-1">Canjear puntos</h2>
        <p className="text-slate-400 text-sm mb-4">
          {contacto.name || contacto.phone} tiene <span className="text-yellow-400 font-bold">{contacto.puntos}</span> puntos disponibles.
        </p>
        <input
          value={puntos}
          onChange={(e) => setPuntos(e.target.value)}
          type="number"
          min="1"
          max={contacto.puntos}
          placeholder="Cantidad a canjear"
          className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm mb-4"
        />
        {mutation.isError && (
          <p className="text-red-400 text-xs mb-2">Puntos insuficientes o error.</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => mutation.mutate()}
            disabled={!puntos || Number(puntos) < 1 || Number(puntos) > contacto.puntos || mutation.isPending}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm"
          >
            {mutation.isPending ? 'Canjeando...' : 'Canjear'}
          </button>
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function detectarPrefijo(phone: string) {
  if (!phone) return PAISES[0];
  return PAISES.find((p) => phone.startsWith(p.prefijo)) ?? PAISES[0];
}

function ContactoModal({
  contacto,
  onClose,
}: {
  contacto?: Contacto;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const paisInicial = contacto ? detectarPrefijo(contacto.phone) : PAISES[0];
  const numeroInicial = contacto
    ? contacto.phone.replace(paisInicial.prefijo, '')
    : '';

  const [pais, setPais] = useState(paisInicial);
  const [numero, setNumero] = useState(numeroInicial);
  const [name, setName] = useState(contacto?.name ?? '');
  const [email, setEmail] = useState(contacto?.email ?? '');
  const [notes, setNotes] = useState(contacto?.notes ?? '');
  const [tags, setTags] = useState(contacto?.tags ?? '');

  const phone = `${pais.prefijo}${numero.replace(/\D/g, '')}`;

  const mutation = useMutation({
    mutationFn: () =>
      contacto
        ? actualizarContacto(contacto.id, { phone, name, email, notes, tags })
        : upsertContacto({ phone, name, email, notes, tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-white font-bold mb-4">{contacto ? 'Editar contacto' : 'Nuevo contacto'}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">País</label>
            <select
              value={pais.codigo}
              onChange={(e) => {
                const p = PAISES.find((x) => x.codigo === e.target.value)!;
                setPais(p);
              }}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
            >
              {PAISES.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nombre} ({p.prefijo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Teléfono *</label>
            <div className="flex gap-2">
              <span className="bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-sm font-mono flex items-center">
                {pais.prefijo}
              </span>
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="3001234567"
                type="tel"
                className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">Número completo: {phone}</p>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Etiquetas (ej: cliente, vip)"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas"
            rows={2}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm resize-none"
          />
        </div>
        {mutation.isError && (
          <p className="text-red-400 text-xs mt-2">Error al guardar. Verifica los datos.</p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => mutation.mutate()}
            disabled={!numero || mutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ContactosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; contacto?: Contacto }>({ open: false });
  const [canjearModal, setCanjearModal] = useState<Contacto | null>(null);

  const { data: contactos = [], isLoading } = useQuery({
    queryKey: ['contactos', search],
    queryFn: () => getContactos(search || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eliminarContacto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contactos'] }),
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {modal.open && (
        <ContactoModal
          contacto={modal.contacto}
          onClose={() => setModal({ open: false })}
        />
      )}
      {canjearModal && (
        <CanjearModal contacto={canjearModal} onClose={() => setCanjearModal(null)} />
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Contactos ({contactos.length})</h1>
        <button
          onClick={() => setModal({ open: true })}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Nuevo contacto
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, teléfono o email..."
        className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none mb-4"
      />

      {isLoading ? (
        <div className="text-slate-400">Cargando...</div>
      ) : contactos.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">👥</p>
          <p>{search ? 'No se encontraron contactos' : 'No hay contactos aún'}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Teléfono</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Etiquetas</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Puntos</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contactos.map((c: Contacto) => (
                  <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white">{c.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{c.phone}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{c.email || '—'}</td>
                    <td className="px-4 py-3">
                      {c.tags ? (
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{c.tags}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-400 font-semibold text-sm">★ {c.puntos ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal({ open: true, contacto: c })}
                          className="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-2 py-1 rounded"
                        >
                          Editar
                        </button>
                        {(c.puntos ?? 0) > 0 && (
                          <button
                            onClick={() => setCanjearModal(c)}
                            className="text-xs bg-yellow-700 hover:bg-yellow-600 text-yellow-100 px-2 py-1 rounded"
                          >
                            Canjear
                          </button>
                        )}
                        <button
                          onClick={() => { if (confirm('¿Eliminar contacto?')) deleteMutation.mutate(c.id); }}
                          className="text-xs bg-red-800 hover:bg-red-700 text-red-200 px-2 py-1 rounded"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {contactos.map((c: Contacto) => (
              <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-semibold">{c.name || c.phone}</p>
                    <p className="text-slate-400 text-xs font-mono">{c.phone}</p>
                  </div>
                  {c.tags && (
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{c.tags}</span>
                  )}
                </div>
                {c.email && <p className="text-slate-400 text-xs mb-2">{c.email}</p>}
                {c.notes && <p className="text-slate-500 text-xs mb-2 italic">{c.notes}</p>}
                {(c.puntos ?? 0) > 0 && (
                  <p className="text-yellow-400 text-xs font-semibold mb-2">★ {c.puntos} puntos</p>
                )}
                <div className="flex gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => setModal({ open: true, contacto: c })}
                    className="flex-1 text-xs bg-indigo-700 hover:bg-indigo-600 text-white py-1.5 rounded-lg"
                  >
                    Editar
                  </button>
                  {(c.puntos ?? 0) > 0 && (
                    <button
                      onClick={() => setCanjearModal(c)}
                      className="flex-1 text-xs bg-yellow-700 hover:bg-yellow-600 text-yellow-100 py-1.5 rounded-lg"
                    >
                      Canjear
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(c.id); }}
                    className="flex-1 text-xs bg-red-800 hover:bg-red-700 text-red-200 py-1.5 rounded-lg"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
