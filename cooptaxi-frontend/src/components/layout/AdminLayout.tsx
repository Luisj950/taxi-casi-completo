import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, FileText,
  DollarSign, AlertTriangle, Radio, LogOut, Zap, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';

const NAV = [
  { to: '/admin',            label: 'Dashboard',      icon: LayoutDashboard, roles: ['ADMIN','DESPACHADOR'] },
  { to: '/admin/socios',     label: 'Socios',          icon: Users,           roles: ['ADMIN'] },
  { to: '/admin/flota',      label: 'Flota',           icon: Car,             roles: ['ADMIN'] },
  { to: '/admin/documentos', label: 'Documentos',      icon: FileText,        roles: ['ADMIN','DESPACHADOR'] },
  { to: '/admin/finanzas',   label: 'Finanzas',        icon: DollarSign,      roles: ['ADMIN'] },
  { to: '/admin/incidentes', label: 'Incidentes',      icon: AlertTriangle,   roles: ['ADMIN','DESPACHADOR'] },
    { to: '/admin/reportes', label: 'Reportes', icon: BarChart2, roles: ['ADMIN'] },
  { to: '/despacho',         label: 'Central',         icon: Radio,           roles: ['ADMIN','DESPACHADOR'] },
  { to: '/despacho/alta-demanda', label: 'Alta demanda', icon: Zap,           roles: ['ADMIN','DESPACHADOR'] },
];

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const visibleNav = NAV.filter((n) => user && n.roles.includes(user.rol));

  async function logout() {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-52 flex-shrink-0 flex flex-col bg-white border-r border-gray-100 h-screen">

        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">CT</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">CoopTaxi</p>
              <p className="text-[10px] text-gray-400 leading-tight">{user?.rol}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin' || to === '/despacho'}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-800 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
              )}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Usuario */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
              {user?.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{user?.nombre}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido ───────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
