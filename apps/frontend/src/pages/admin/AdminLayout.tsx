import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'SUPERADMIN') return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <aside className="w-56 bg-slate-950 flex flex-col flex-shrink-0 border-r border-slate-800">
        <div className="p-5 border-b border-slate-800">
          <p className="font-black text-white text-xl">A360</p>
          <p className="text-xs text-red-400 font-semibold mt-0.5">SUPERADMIN</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { to: '/admin', label: 'Dashboard', emoji: '🏠', end: true },
            { to: '/admin/tenants', label: 'Tenants', emoji: '🏢', end: false },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <NavLink to="/dashboard" className="text-xs text-slate-500 hover:text-slate-300">
            ← Volver al app
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-900">
        <Outlet />
      </main>
    </div>
  );
}
