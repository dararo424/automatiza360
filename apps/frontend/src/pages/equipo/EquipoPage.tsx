import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import {
  getEquipo,
  invitarUsuario,
  eliminarMiembro,
  type TeamMember,
} from '../../api/equipo';

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-amber-700 text-amber-200',
  ADMIN: 'bg-indigo-700 text-indigo-200',
  STAFF: 'bg-slate-700 text-slate-300',
};

function InvitarModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');

  const mutation = useMutation({
    mutationFn: () => invitarUsuario({ name, email, password, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipo'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-white font-bold mb-4">Invitar usuario</h2>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre completo"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña temporal"
            type="password"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          >
            <option value="STAFF">STAFF</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        {mutation.isError && (
          <p className="text-red-400 text-sm mt-2">Error al crear usuario. Verifica los datos.</p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => mutation.mutate()}
            disabled={!name || !email || !password || mutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {mutation.isPending ? 'Creando...' : 'Crear usuario'}
          </button>
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function EquipoPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const canManage = user?.role === 'OWNER' || user?.role === 'ADMIN';

  const { data: equipo = [], isLoading } = useQuery({
    queryKey: ['equipo'],
    queryFn: getEquipo,
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarMiembro(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipo'] }),
  });

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {showModal && <InvitarModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Equipo ({equipo.length})</h1>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Invitar usuario
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-slate-400">Cargando...</div>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          {equipo.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No hay miembros en el equipo</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {equipo.map((m: TeamMember) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3 gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm">{m.name}</p>
                    <p className="text-slate-400 text-xs truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[m.role] ?? 'bg-slate-700 text-slate-300'}`}>
                      {m.role}
                    </span>
                    {canManage && m.id !== user?.id && m.role !== 'OWNER' && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Desactivar a ${m.name}?`)) eliminarMutation.mutate(m.id);
                        }}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
