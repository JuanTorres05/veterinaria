import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  Users, Cat, CalendarBlank, Stethoscope,
  ArrowRight, Plus, ClipboardText, ChartBar, CheckCircle
} from "@phosphor-icons/react";

const ROL_CONFIG = {
  admin:         { icon: "🛡️", greeting: "Panel de administración general" },
  veterinario:   { icon: "🩺", greeting: "Panel clínico y consultas" },
  recepcionista: { icon: "📋", greeting: "Panel de recepción y registros" },
};

const ROL_ACCESOS = {
  admin: [
    { to: "/registrar", icon: Plus,          label: "Registrar Paciente", desc: "Alta de nuevo propietario y su mascota en el sistema.",            btnLabel: "Nuevo Registro",  actionClass: "bg-sky-600 hover:bg-sky-700" },
    { to: "/agenda",    icon: CalendarBlank, label: "Agenda de Citas",    desc: "Gestionar consultas médicas, estados y programación diaria.",      btnLabel: "Ver Agenda",     actionClass: "bg-emerald-600 hover:bg-emerald-700" },
    { to: "/pacientes", icon: ClipboardText, label: "Buscar Paciente",    desc: "Consultar expedientes, datos de contacto e historias clínicas.",    btnLabel: "Ver Pacientes",  actionClass: "bg-slate-800 hover:bg-slate-900" },
    { to: "/reportes",  icon: ChartBar,      label: "Reportes Clínicos",  desc: "Métricas del sistema, citas atendidas y estadísticas operativas.",  btnLabel: "Ver Reportes",   actionClass: "bg-cyan-700 hover:bg-cyan-800" },
  ],
  recepcionista: [
    { to: "/registrar", icon: Plus,          label: "Registrar Paciente", desc: "Alta de nuevo propietario y su mascota en el sistema.",         btnLabel: "Nuevo Registro", actionClass: "bg-sky-600 hover:bg-sky-700" },
    { to: "/agenda",    icon: CalendarBlank, label: "Agenda de Citas",    desc: "Gestionar consultas médicas, estados y programación diaria.",   btnLabel: "Ver Agenda",     actionClass: "bg-emerald-600 hover:bg-emerald-700" },
    { to: "/pacientes", icon: ClipboardText, label: "Buscar Paciente",    desc: "Consultar expedientes, datos de contacto e historias clínicas.", btnLabel: "Ver Pacientes",  actionClass: "bg-slate-800 hover:bg-slate-900" },
  ],
  veterinario: [
    { to: "/agenda",    icon: CalendarBlank, label: "Agenda de Citas",    desc: "Visualizar pacientes agendados y registrar atención médica.",    btnLabel: "Ver Agenda",    actionClass: "bg-emerald-600 hover:bg-emerald-700" },
    { to: "/pacientes", icon: ClipboardText, label: "Buscar Paciente",    desc: "Consultar expedientes, datos de contacto e historias clínicas.", btnLabel: "Ver Pacientes", actionClass: "bg-slate-800 hover:bg-slate-900" },
  ],
};

function getSaludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const cfg     = ROL_CONFIG[user?.rol]  ?? ROL_CONFIG.admin;
  const accesos = ROL_ACCESOS[user?.rol] ?? [];

  const [stats,   setStats]   = useState({ clientes: "-", mascotas: "-", citasHoy: "-", veterinarios: "-" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.get("/citas/dashboard-stats");
        setStats(res.data);
      } catch (err) {
        console.error("Error al cargar métricas del dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Formato de fecha sobrio integrado en la cabecera
  const fechaHoy = new Date().toLocaleDateString("es-CO", { 
    weekday: "long", 
    day: "numeric", 
    month: "long",
    year: "numeric"
  });

  const citasHoyNum = Number(stats.citasHoy) || 0;

  const statsItems = [
    { 
      label: "Clientes registrados",  
      value: stats.clientes,     
      icon: Users,        
      accentColor: "text-sky-600",
      bgColor: "bg-sky-50 border-sky-200",
      badgeText: "Dueños activos",
      badgeClass: "bg-sky-100 text-sky-800"
    },
    { 
      label: "Mascotas registradas",  
      value: stats.mascotas,     
      icon: Cat,          
      accentColor: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-200",
      badgeText: "Pacientes clínica",
      badgeClass: "bg-emerald-100 text-emerald-800"
    },
    { 
      label: "Citas para hoy",         
      value: stats.citasHoy,     
      icon: CalendarBlank,
      accentColor: citasHoyNum > 0 ? "text-amber-600" : "text-slate-600",
      bgColor: citasHoyNum > 0 ? "bg-amber-50 border-amber-200" : "bg-slate-100 border-slate-200",
      // Si es 0 citas, mostrar un estado neutral en vez de amarillo de alerta (#5)
      badgeText: citasHoyNum > 0 ? "Pendientes hoy" : "Sin citas hoy",
      badgeClass: citasHoyNum > 0 ? "bg-amber-100 text-amber-800 font-bold" : "bg-slate-200 text-slate-700"
    },
    { 
      label: "Veterinarios activos",  
      value: stats.veterinarios, 
      icon: Stethoscope,  
      accentColor: "text-indigo-600",
      bgColor: "bg-indigo-50 border-indigo-200",
      badgeText: "Equipo médico",
      badgeClass: "bg-indigo-100 text-indigo-800"
    },
  ];

  return (
    <div className="space-y-7 animate-fade-in pb-4">

      {/* ── Cabecera Principal Sobria (Saludo + Fecha Integrada sin tarjeta gigante) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-2xl flex-shrink-0">
            {cfg.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {getSaludo()}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500 capitalize">
                {fechaHoy}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {user?.nombre}
            </h1>
            <p className="text-xs font-medium text-slate-500">
              {cfg.greeting}
            </p>
          </div>
        </div>

        {/* Estado Operativo Discreto */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-800 text-xs font-semibold self-start md:self-auto">
          <CheckCircle size={15} weight="fill" className="text-emerald-600" />
          <span>Sistema Operativo</span>
        </div>
      </div>

      {/* ── Métricas Operativas (Sin flechas de tendencia engañosas) ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Resumen Clínico & Operativo
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsItems.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.bgColor} ${s.accentColor}`}>
                    <Icon size={20} weight="fill" />
                  </div>
                  {/* Badge semántico significativo (#4) */}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.badgeClass}`}>
                    {s.badgeText}
                  </span>
                </div>
                
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                  {loading ? <span className="inline-block w-12 h-7 bg-slate-200 animate-pulse rounded" /> : s.value}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Acciones Rápida con Sistema Semántico de Botones ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Acciones Frecuentes
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {accesos.map((acc, idx) => {
            const ActionIcon = acc.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between" style={{ minHeight: "165px" }}>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-700">
                      <ActionIcon size={18} weight="bold" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      {acc.label}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {acc.desc}
                  </p>
                </div>

                <div className="pt-4">
                  <Link 
                    to={acc.to}
                    className={`w-full h-10 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-between transition-all active:scale-[0.98] ${acc.actionClass}`}>
                    <span>{acc.btnLabel}</span>
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
