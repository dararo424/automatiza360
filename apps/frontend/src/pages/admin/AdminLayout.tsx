import { useState } from 'react';
import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'SUPERADMIN') return <Navigate to="/dashboard" replace />;

  const navItems = [
    { to: '/admin', label: 'Dashboard', emoji: '🏠', end: true },
    { to: '/admin/tenants', label: 'Tenants', emoji: '🏢', end: false },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'w-56 bg-slate-950 flex flex-col flex-shrink-0 border-r border-slate-800 h-full',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:translate-x-0 md:z-auto',
        ].join(' ')}
      >
        <div className="p-5 border-b border-slate-800">
          <p className="font-black text-white text-xl">A360</p>
          <p className="text-xs text-red-400 font-semibold mt-0.5">SUPERADMIN</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsMobileOpen(false)}
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

      {/* Content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-950 border-b border-slate-800 flex-shrink-0">
          <button
            onClick={() => setIsMobileOpen((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Menú"
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <p className="font-bold text-white text-sm">A360</p>
          <span className="text-xs text-red-400 font-semibold">SUPERADMIN</span>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
