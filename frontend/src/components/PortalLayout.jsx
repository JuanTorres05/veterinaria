import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PawPrint,
  House,
  CalendarHeart,
  UserCircle,
  SignOut,
} from '@phosphor-icons/react';

const PORTAL_NAV = [
  { to: '/portal', label: 'Mis Peluditos', icon: House, exact: true },
  { to: '/portal/citas', label: 'Mis Citas', icon: CalendarHeart },
  { to: '/portal/perfil', label: 'Mi Perfil', icon: UserCircle },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function isActive(item) {
    if (item.exact) {
      return location.pathname === '/portal' || location.pathname.startsWith('/portal/mascotas/');
    }
    return location.pathname === item.to || location.pathname.startsWith(item.to + '/');
  }

  const initials = (user?.nombre || 'P')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      className="min-h-screen flex flex-col text-slate-800 antialiased overflow-x-hidden"
      style={{
        background:
          'radial-gradient(circle at 0% 0%, #FFF7ED 0%, #FFFDF9 42%, #F0FDFA 100%)',
      }}
    >
      {/* Huellas decorativas globales de fondo contenidas sin desbordar en móvil */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-16 left-2 sm:left-6 opacity-[0.16] text-teal-500 rotate-[-22deg]">
          <PawPrint size={110} weight="fill" />
        </div>
        <div className="absolute top-36 -right-4 sm:right-12 opacity-[0.16] text-amber-400 rotate-[18deg]">
          <PawPrint size={150} weight="fill" />
        </div>
        <div className="absolute top-1/2 left-4 sm:left-12 -translate-y-1/2 opacity-[0.13] text-sky-500 rotate-[35deg]">
          <PawPrint size={100} weight="fill" />
        </div>
        <div className="absolute top-1/2 right-4 sm:right-20 -translate-y-1/2 opacity-[0.15] text-emerald-500 rotate-[-15deg]">
          <PawPrint size={135} weight="fill" />
        </div>
        <div className="absolute bottom-20 left-8 sm:left-24 opacity-[0.16] text-orange-400 rotate-[12deg]">
          <PawPrint size={150} weight="fill" />
        </div>
        <div className="absolute bottom-10 -right-4 sm:right-10 opacity-[0.18] text-teal-500 rotate-[-25deg]">
          <PawPrint size={180} weight="fill" />
        </div>
        <div className="hidden sm:block absolute top-1/3 left-1/3 opacity-[0.13] text-amber-400 rotate-[5deg]">
          <PawPrint size={95} weight="fill" />
        </div>
        <div className="hidden sm:block absolute bottom-1/3 right-1/3 opacity-[0.14] text-cyan-500 rotate-[-8deg]">
          <PawPrint size={105} weight="fill" />
        </div>
      </div>
      {/* Cabecera Superior Cálida y Amigable */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-lg border-b border-amber-100/90 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/portal" className="group flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-sky-500 flex items-center justify-center shadow-md shadow-teal-500/20 flex-shrink-0 group-hover:rotate-6 group-hover:scale-105 transition-transform">
              <PawPrint size={22} weight="fill" className="text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-base text-slate-900 tracking-tight block leading-none">
                DataVet
              </span>
              <span className="text-[11px] font-bold text-teal-600">
                Tu espacio de cuidado animal 🐾
              </span>
            </div>
          </Link>

          {/* Navegación Desktop en cápsula */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-amber-50/80 border border-amber-100">
            {PORTAL_NAV.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    active
                      ? 'bg-white text-teal-700 shadow-xs border border-teal-100'
                      : 'text-slate-600 hover:text-teal-700 hover:bg-white/60'
                  }`}
                >
                  <Icon size={16} weight={active ? 'fill' : 'duotone'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Perfil + Salir */}
          <div className="flex items-center gap-2">
            <Link
              to="/portal/perfil"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-amber-200/80 hover:border-teal-300 shadow-2xs transition-all"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[11px] font-extrabold flex items-center justify-center shadow-2xs">
                {initials}
              </div>
              <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate">
                {user?.nombre}
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
            >
              <SignOut size={16} weight="bold" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal (sin z-index propio para que los modales z-50 queden SIEMPRE por encima de la barra móvil) */}
      <main className="relative flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-6 pb-28 md:pb-12">
        <Outlet />
      </main>

      {/* Dock Móvil Inferior Flotante */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-30 bg-white/95 backdrop-blur-lg border border-amber-200/80 rounded-2xl px-2 py-2 shadow-xl shadow-slate-900/10">
        <div className="grid grid-cols-3 gap-1">
          {PORTAL_NAV.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-extrabold transition-all ${
                  active
                    ? 'text-teal-700 bg-teal-50 border border-teal-100'
                    : 'text-slate-500'
                }`}
              >
                <Icon size={20} weight={active ? 'fill' : 'duotone'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
