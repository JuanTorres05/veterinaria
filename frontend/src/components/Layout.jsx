import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  House, 
  Calendar, 
  UserPlus, 
  ChartBar, 
  SignOut, 
  ClipboardText,
  Monitor,
  PawPrint,
  UsersThree,
  FirstAidKit
} from "@phosphor-icons/react";

const NAV_ITEMS = [
  { to: "/dashboard",       label: "Inicio",          icon: House,         roles: ["admin", "veterinario", "recepcionista"] },
  { to: "/agenda",          label: "Agenda",          icon: Calendar,      roles: ["admin", "veterinario", "recepcionista"] },
  { to: "/monitoreo",       label: "Sala de Espera",  icon: Monitor,       roles: ["admin", "veterinario", "recepcionista"] },
  { to: "/hospitalizacion", label: "Hospitalización", icon: FirstAidKit,   roles: ["admin", "veterinario", "recepcionista"] },
  { to: "/pacientes",       label: "Pacientes",       icon: ClipboardText, roles: ["admin", "veterinario", "recepcionista"] },
  { to: "/registrar", label: "Registrar", icon: UserPlus,      roles: ["admin", "recepcionista"] },
  { to: "/reportes",  label: "Reportes",  icon: ChartBar,      roles: ["admin"] },
  { to: "/usuarios",  label: "Usuarios",  icon: UsersThree,    roles: ["admin"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const mainLinks = NAV_ITEMS.filter((item) => item.roles.includes(user?.rol));

  // Obtener el módulo activo actual para mostrar en la cabecera
  const currentModule = location.pathname.startsWith("/atender/")
    ? "Espacio de Consulta Clínica"
    : NAV_ITEMS.find((item) =>
        location.pathname === item.to || location.pathname.startsWith(item.to + "/")
      )?.label || "Panel Clínico";

  return (
    <div className="flex h-screen overflow-hidden antialiased bg-slate-50 text-slate-900">
      
      {/* Sidebar — Unificado con la Paleta Navy/Slate #0F172A de la Marca */}
      <aside className="w-[60px] lg:w-[250px] flex flex-col flex-shrink-0 z-20 border-r border-slate-800 bg-[#0F172A] text-slate-100">
        
        {/* Logo de la Clínica */}
        <div className="h-14 flex items-center px-3 lg:px-5 border-b border-slate-800 flex-shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 w-full min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-cyan-600 to-sky-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              <PawPrint size={18} weight="fill" className="text-white" />
            </div>
            <span className="font-extrabold text-base hidden lg:inline text-white truncate tracking-tight">
              DataVet
            </span>
          </Link>
        </div>

        {/* Menú de Navegación Principal */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <p className="hidden lg:block px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Navegación
          </p>
          {mainLinks.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link 
                key={item.label} 
                to={item.to} 
                title={item.label}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all select-none ${
                  active 
                    ? "bg-sky-500/15 text-sky-400 font-bold border-l-2 border-sky-400" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium"
                }`}>
                <Icon size={18} weight={active ? "fill" : "regular"} className="flex-shrink-0" />
                <span className="hidden lg:inline text-sm truncate">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Pie de Sidebar — Solo botón de salida */}
        <div className="border-t border-slate-800 p-2 flex-shrink-0">
          <button 
            onClick={handleLogout} 
            title="Cerrar sesión"
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all text-sm font-semibold">
            <SignOut size={18} className="flex-shrink-0" />
            <span className="hidden lg:inline">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE CONTENIDO */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        
        {/* Header Superior Limpio y Sobrio (Sin Barra de Búsqueda Redundante) */}
        <header className="h-14 flex items-center justify-between px-5 flex-shrink-0 z-10 border-b border-slate-200 bg-white shadow-xs">
          
          {/* Módulo Activo / Identidad del Sistema */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              DataVet
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-700">
              {currentModule}
            </span>
          </div>

          {/* Única Representación del Usuario en Todo el Sistema (Avatar + Nombre + Rol) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                  {user?.nombre}
                </p>
                <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700">
                  {user?.rol}
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout} 
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all">
              <SignOut size={18} />
            </button>
          </div>
        </header>

        {/* Contenido de la Página con Huellas Vibrantes de Fondo */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative bg-slate-50">
          
          {/* Huellas decorativas globales de fondo (Color Cyan/Sky vibrante con 20-25% opacidad) */}
          <div className="fixed top-12 left-10 pointer-events-none opacity-[0.22] z-0 text-cyan-600 rotate-[-22deg]">
            <PawPrint size={130} weight="fill" />
          </div>
          <div className="fixed top-36 right-16 pointer-events-none opacity-[0.20] z-0 text-sky-600 rotate-[18deg]">
            <PawPrint size={170} weight="fill" />
          </div>
          <div className="fixed top-1/2 left-16 -translate-y-1/2 pointer-events-none opacity-[0.18] z-0 text-teal-600 rotate-[35deg]">
            <PawPrint size={110} weight="fill" />
          </div>
          <div className="fixed top-1/2 right-24 -translate-y-1/2 pointer-events-none opacity-[0.22] z-0 text-cyan-600 rotate-[-15deg]">
            <PawPrint size={150} weight="fill" />
          </div>
          <div className="fixed bottom-12 left-28 pointer-events-none opacity-[0.24] z-0 text-sky-600 rotate-[12deg]">
            <PawPrint size={180} weight="fill" />
          </div>
          <div className="fixed bottom-8 right-12 pointer-events-none opacity-[0.25] z-0 text-cyan-600 rotate-[-25deg]">
            <PawPrint size={220} weight="fill" />
          </div>
          <div className="fixed top-1/3 left-1/3 pointer-events-none opacity-[0.16] z-0 text-teal-600 rotate-[5deg]">
            <PawPrint size={95} weight="fill" />
          </div>
          <div className="fixed bottom-1/3 right-1/3 pointer-events-none opacity-[0.16] z-0 text-sky-600 rotate-[-8deg]">
            <PawPrint size={105} weight="fill" />
          </div>

          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
