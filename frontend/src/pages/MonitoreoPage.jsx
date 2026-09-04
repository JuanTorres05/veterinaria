import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Monitor,
  Clock,
  CheckCircle,
  XCircle,
  ArrowClockwise,
  Dog,
  Cat,
  Bird,
  PawPrint,
  Stethoscope,
  User,
  Warning,
  Circle,
  Phone,
  CalendarBlank
} from '@phosphor-icons/react';

/* ── Helpers ───────────────────────────────────────────────────────────── */
function renderSpeciesIcon(especie) {
  const e = (especie || '').toLowerCase();
  if (e.includes('perro') || e.includes('canino')) return <Dog size={22} weight="fill" className="text-sky-600" />;
  if (e.includes('gato') || e.includes('felino')) return <Cat size={22} weight="fill" className="text-emerald-600" />;
  if (e.includes('ave') || e.includes('loro') || e.includes('pájaro')) return <Bird size={22} weight="fill" className="text-amber-600" />;
  return <PawPrint size={22} weight="fill" className="text-indigo-600" />;
}

function formatHora(fechaHora) {
  if (!fechaHora) return '';
  return new Date(fechaHora).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatFecha(d) {
  return new Date(d).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/* ── Indicator aislado sin causar re-render global cada segundo ─────────── */
function LiveIndicator({ onRefresh, isRefreshing }) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          onRefresh(true); // disparo automático en segundo plano
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRefresh]);

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
      <span className="text-xs font-bold text-emerald-800 tracking-tight">
        {isRefreshing ? 'Actualizando datos...' : `En vivo • actualiza en ${seconds}s`}
      </span>
    </div>
  );
}

/* ── CitaCard Con Botón Cancelar Discreto (Baja Prominencia) ────────────── */
function CitaCard({ cita, onCambiarEstado, loadingId, userRol }) {
  const isPendiente = cita.estado === 'pendiente';
  const isAtendida  = cita.estado === 'atendida';
  const isCancelada = cita.estado === 'cancelada';
  const isLoading   = loadingId === cita.id;

  const puedeAtender  = ['admin', 'veterinario', 'recepcionista'].includes(userRol);
  const puedeCancelar = ['admin', 'recepcionista'].includes(userRol);

  function handleCancelarClick() {
    if (window.confirm(`¿Confirma que desea cancelar la cita de ${cita.mascota_nombre}?`)) {
      onCambiarEstado(cita.id, 'cancelada');
    }
  }

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
      isCancelada ? 'opacity-55 border-slate-200 bg-slate-50' : 'border-slate-200 hover:shadow-md'
    }`}>
      <div className="flex items-start gap-3.5">
        {/* Icono Especie */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${
          isPendiente
            ? 'bg-amber-50 border-amber-200'
            : isAtendida
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-rose-50 border-rose-200'
        }`}>
          {renderSpeciesIcon(cita.especie)}
        </div>

        {/* Info Paciente y Propietario */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-extrabold text-slate-900 text-sm leading-tight">
                {cita.mascota_nombre}
                <span className="text-slate-400 font-normal text-xs ml-1.5">
                  ({cita.especie})
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <User size={12} className="text-slate-400 flex-shrink-0" />
                {cita.cliente_nombre}
                {cita.telefono && (
                  <span className="text-slate-400 ml-1">
                    • Tel: {cita.telefono}
                  </span>
                )}
              </p>
            </div>

            {/* Hora Programada */}
            <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 flex-shrink-0">
              <Clock size={13} className="text-sky-600" />
              <span className="text-xs font-bold text-sky-800">
                {formatHora(cita.fecha_hora)}
              </span>
            </div>
          </div>

          {/* Motivo de Consulta */}
          <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
            <span className="font-bold text-slate-800">Motivo:</span> {cita.motivo}
          </p>

          {/* Veterinario Asignado */}
          <div className="flex items-center gap-1.5 mt-2 text-slate-500">
            <Stethoscope size={13} className="text-sky-600 flex-shrink-0" />
            <span className="text-xs font-semibold">
              Dr(a). {cita.veterinario_nombre}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones para Citas Pendientes — Cancelar tiene baja prominencia visual */}
      {isPendiente && (
        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
          {puedeAtender && (
            <button
              onClick={() => onCambiarEstado(cita.id, 'atendida')}
              disabled={isLoading}
              className="btn-action-nav flex-1 justify-center h-9 text-xs">
              <CheckCircle size={15} weight="bold" />
              <span>{isLoading ? 'Guardando...' : 'Marcar Atendida'}</span>
            </button>
          )}

          {/* Botón Cancelar sutil / discreto de baja prominencia para evitar clics accidentales */}
          {puedeCancelar && (
            <button
              onClick={handleCancelarClick}
              disabled={isLoading}
              title="Cancelar esta cita de forma irreversible"
              className="px-3 py-1.5 h-9 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent transition-all flex items-center gap-1 opacity-70 hover:opacity-100">
              <XCircle size={15} />
              <span>Cancelar Cita</span>
            </button>
          )}
        </div>
      )}

      {/* Estado final si fue Atendida o Cancelada */}
      {!isPendiente && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado actual</span>
          {isAtendida ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle size={13} weight="fill" /> Atendida
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
              <XCircle size={13} weight="fill" /> Cancelada
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Componente Principal ────────────────────────────────────────────────── */
export default function MonitoreoPage() {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const hoyStr = (() => {
    const t = new Date();
    return new Date(t - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  })();

  const loadCitas = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      else setIsRefreshing(true);
      
      setError('');
      const res = await api.get(`/citas?fecha=${hoyStr}`);
      setCitas(res.data);
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las citas del monitoreo en vivo.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [hoyStr]);

  useEffect(() => {
    loadCitas(false);
  }, [loadCitas]);

  async function handleCambiarEstado(citaId, nuevoEstado) {
    try {
      setLoadingId(citaId);
      await api.patch(`/citas/${citaId}/estado`, { estado: nuevoEstado });
      setCitas((prev) =>
        prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c))
      );
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar el estado de la cita.');
    } finally {
      setLoadingId(null);
    }
  }

  const citasPendientes = citas.filter((c) => c.estado === 'pendiente');
  const citasAtendidas  = citas.filter((c) => c.estado === 'atendida');
  const citasCanceladas = citas.filter((c) => c.estado === 'cancelada');

  return (
    <div className="space-y-7 animate-fade-in pb-6">

      {/* Barrita de progreso durante auto-refresh silencioso */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-sky-600 animate-pulse z-50" />
      )}

      {/* ── Cabecera Principal ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 shadow-xs">
            <Monitor size={22} weight="fill" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monitoreo en Tiempo Real
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500 capitalize">
                {formatFecha(new Date())}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Flujo de Atención Médica
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <LiveIndicator onRefresh={loadCitas} isRefreshing={isRefreshing} />
          <button
            onClick={() => loadCitas(false)}
            disabled={loading || isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xs">
            <ArrowClockwise size={14} className={loading || isRefreshing ? 'animate-spin text-sky-600' : 'text-slate-500'} />
            <span>Actualizar Ahora</span>
          </button>
        </div>
      </div>

      {/* ── Tarjetas Resumen KPI del Día ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pacientes en Espera', value: citasPendientes.length, accent: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
          { label: 'Citas Atendidas Hoy', value: citasAtendidas.length, accent: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
          { label: 'Citas Canceladas', value: citasCanceladas.length, accent: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', icon: XCircle },
        ].map(({ label, value, accent, bg, icon: IconComponent }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${bg} ${accent}`}>
                <IconComponent size={20} weight="fill" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 leading-none">
                  {loading ? <span className="inline-block w-8 h-6 bg-slate-200 animate-pulse rounded" /> : value}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm font-semibold">
          <Warning size={18} weight="bold" className="flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Seccion: Pacientes en Espera ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pacientes en Espera
          </h2>
          {citasPendientes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
              {citasPendientes.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((k) => (
              <div key={k} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : citasPendientes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xl mx-auto mb-3">
              <CheckCircle size={24} weight="fill" />
            </div>
            <p className="font-bold text-sm text-slate-900">Sin pacientes en sala de espera</p>
            <p className="text-xs text-slate-500 mt-1">Todos los pacientes programados para hoy han sido atendidos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {citasPendientes.map((cita) => (
              <CitaCard
                key={cita.id}
                cita={cita}
                onCambiarEstado={handleCambiarEstado}
                loadingId={loadingId}
                userRol={user?.rol}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Seccion: Atendidos Hoy ── */}
      {!loading && citasAtendidas.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5 mb-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Atendidos Hoy
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {citasAtendidas.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {citasAtendidas.map((cita) => (
              <CitaCard
                key={cita.id}
                cita={cita}
                onCambiarEstado={handleCambiarEstado}
                loadingId={loadingId}
                userRol={user?.rol}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Seccion: Canceladas Hoy ── */}
      {!loading && citasCanceladas.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5 mb-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Canceladas Hoy
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
              {citasCanceladas.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {citasCanceladas.map((cita) => (
              <CitaCard
                key={cita.id}
                cita={cita}
                onCambiarEstado={handleCambiarEstado}
                loadingId={loadingId}
                userRol={user?.rol}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Sin citas en todo el día ── */}
      {!loading && citas.length === 0 && !error && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center text-2xl mx-auto mb-3">
            <CalendarBlank size={28} weight="fill" />
          </div>
          <p className="font-bold text-base text-slate-900">Sin citas programadas para hoy</p>
          <p className="text-xs text-slate-500 mt-1">
            No hay registros de citas en la agenda del día.{' '}
            <a href="/agenda" className="text-sky-600 font-bold hover:underline">
              Ir a la Agenda
            </a>{' '}
            para agendar una consulta.
          </p>
        </div>
      )}

    </div>
  );
}
