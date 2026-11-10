import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { formatBytes, leerArchivosParaSubida } from '../utils/archivos';
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
  CalendarBlank,
  ClipboardText,
  Scales,
  X,
  ArrowSquareOut,
  UploadSimple,
  FilePdf
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
function CitaCard({ cita, onCambiarEstado, onAtenderCita, loadingId, userRol }) {
  const isPendiente = cita.estado === 'pendiente';
  const isAtendida  = cita.estado === 'atendida';
  const isCancelada = cita.estado === 'cancelada';
  const isLoading   = loadingId === cita.id;

  const esVetOAdmin   = ['admin', 'veterinario'].includes(userRol);
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
          {esVetOAdmin ? (
            <button
              onClick={() => onAtenderCita(cita)}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95">
              <Stethoscope size={16} weight="bold" />
              <span>Atender Cita</span>
            </button>
          ) : puedeAtender ? (
            <button
              onClick={() => onCambiarEstado(cita.id, 'atendida')}
              disabled={isLoading}
              className="btn-action-nav flex-1 justify-center h-9 text-xs">
              <CheckCircle size={15} weight="bold" />
              <span>{isLoading ? 'Guardando...' : 'Marcar Atendida'}</span>
            </button>
          ) : null}

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
          <div className="flex items-center gap-2">
            {isAtendida && (
              <Link
                to={`/mascotas/${cita.mascota_id}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 text-[11px] font-bold transition-all">
                <ClipboardText size={13} weight="bold" />
                <span>Ver Historia</span>
              </Link>
            )}
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

  // Estados para Modal de Atención Médica ("Atender Cita")
  const [citaAtender, setCitaAtender] = useState(null);
  const [sintomasInput, setSintomasInput] = useState('');
  const [pesoInput, setPesoInput] = useState('');
  const [diagnosticoInput, setDiagnosticoInput] = useState('');
  const [tratamientoInput, setTratamientoInput] = useState('');
  const [notasInput, setNotasInput] = useState('');
  const [archivosInput, setArchivosInput] = useState([]);
  const [atencionError, setAtencionError] = useState('');
  const [guardandoAtencion, setGuardandoAtencion] = useState(false);
  const [atencionExito, setAtencionExito] = useState(null);
  const atenderFileRef = useRef(null);

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

  function openAtenderModal(cita) {
    setCitaAtender(cita);
    setSintomasInput(cita.motivo || '');
    setPesoInput('');
    setDiagnosticoInput('');
    setTratamientoInput('');
    setNotasInput('');
    setArchivosInput([]);
    setAtencionError('');
  }

  async function handleSelectArchivosAtender(e) {
    try {
      const nuevos = await leerArchivosParaSubida(e.target.files);
      setArchivosInput((prev) => [...prev, ...nuevos].slice(0, 10));
      setAtencionError('');
    } catch (err) {
      setAtencionError(err.message);
    } finally {
      e.target.value = '';
    }
  }

  async function handleAtenderSubmit(e) {
    e.preventDefault();
    if (!citaAtender) return;

    if (!sintomasInput.trim() || sintomasInput.trim().length < 3) {
      return setAtencionError('Los síntomas o motivo de consulta deben tener al menos 3 caracteres.');
    }
    if (!diagnosticoInput.trim() || diagnosticoInput.trim().length < 3) {
      return setAtencionError('El diagnóstico médico es obligatorio (mínimo 3 caracteres).');
    }
    if (!tratamientoInput.trim() || tratamientoInput.trim().length < 3) {
      return setAtencionError('El tratamiento o prescripción es obligatorio (mínimo 3 caracteres).');
    }

    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = new Date(Date.now() - tzOffset).toISOString().slice(0, 19);

    try {
      setGuardandoAtencion(true);
      setAtencionError('');
      await api.post(`/mascotas/${citaAtender.mascota_id}/historial`, {
        cita_id: citaAtender.id,
        fecha: localISOTime,
        motivo: sintomasInput.trim(),
        diagnostico: diagnosticoInput.trim(),
        tratamiento: tratamientoInput.trim(),
        notas: notasInput.trim() || null,
        peso_kg: pesoInput !== '' ? Number(pesoInput) : null,
        archivos: archivosInput,
      });

      const mascotaNombre = citaAtender.mascota_nombre;
      const mascotaId = citaAtender.mascota_id;
      setCitaAtender(null);
      await loadCitas(true);
      setAtencionExito({ mascota: mascotaNombre, mascotaId });
    } catch (err) {
      setAtencionError(err.response?.data?.message || 'Error al registrar la consulta clínica.');
    } finally {
      setGuardandoAtencion(false);
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

      {/* ── Banner de Éxito al Registrar Atención Médica ── */}
      {atencionExito && (
        <div className="animate-fade-in flex items-start gap-4 px-5 py-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <CheckCircle size={22} weight="fill" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-tight">
              ¡Consulta Médica Registrada y Cita Atendida!
            </p>
            <p className="text-sm mt-1 leading-relaxed text-emerald-800">
              Se guardó la evolución clínica de <strong>{atencionExito.mascota}</strong> en su historia clínica.{' '}
              {atencionExito.mascotaId && (
                <Link
                  to={`/mascotas/${atencionExito.mascotaId}`}
                  className="inline-flex items-center gap-1 font-extrabold text-emerald-900 underline hover:text-emerald-700 ml-1">
                  <span>Ver expediente clínico</span>
                  <ArrowSquareOut size={14} weight="bold" />
                </Link>
              )}
            </p>
          </div>
          <button
            onClick={() => setAtencionExito(null)}
            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-all">
            <X size={16} weight="bold" />
          </button>
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
                onAtenderCita={openAtenderModal}
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

      {/* ── MODAL "ATENDER CITA MÉDICA" — Formulario de Registro Clínico ── */}
      {citaAtender && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0F172A] text-slate-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <Stethoscope size={20} weight="bold" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-white tracking-tight">
                    Atención Médica y Registro Clínico
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cita #{citaAtender.id} • {formatHora(citaAtender.fecha_hora)} • Dr(a). {citaAtender.veterinario_nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !guardandoAtencion && setCitaAtender(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all">
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Cuerpo del Formulario Clínico */}
            <form onSubmit={handleAtenderSubmit} className="p-6 space-y-4 overflow-y-auto">

              {/* Resumen del Paciente y Propietario */}
              <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/70">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {renderSpeciesIcon(citaAtender.especie)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{citaAtender.mascota_nombre}</span>
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-bold uppercase">
                        {citaAtender.especie}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Propietario: <strong className="text-slate-200">{citaAtender.cliente_nombre}</strong>
                      {citaAtender.telefono ? ` • Tel: ${citaAtender.telefono}` : ''}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/mascotas/${citaAtender.mascota_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold transition-all">
                  <ClipboardText size={15} weight="bold" />
                  <span>Ver Expediente Completo</span>
                </Link>
              </div>

              {/* Alerta de Error */}
              {atencionError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs font-semibold">
                  <Warning size={18} weight="bold" className="flex-shrink-0 text-rose-400" />
                  <span>{atencionError}</span>
                </div>
              )}

              {/* Fila 1: Síntomas / Motivo y Peso Actual */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Síntomas / Motivo de Consulta <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={sintomasInput}
                    onChange={(e) => setSintomasInput(e.target.value)}
                    placeholder="Síntomas presentados o motivo de la atención..."
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Peso en Consulta (kg)
                  </label>
                  <div className="relative">
                    <Scales size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="500"
                      value={pesoInput}
                      onChange={(e) => setPesoInput(e.target.value)}
                      placeholder="Ej. 12.5"
                      className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 2: Diagnóstico Médico (*) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Diagnóstico Médico <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows="2"
                  value={diagnosticoInput}
                  onChange={(e) => setDiagnosticoInput(e.target.value)}
                  placeholder="Describa el diagnóstico clínico o hallazgos del examen físico..."
                  className="w-full p-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Fila 3: Tratamiento y Prescripción (*) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tratamiento y Medicación Aplicada / Recetada <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows="3"
                  value={tratamientoInput}
                  onChange={(e) => setTratamientoInput(e.target.value)}
                  placeholder="Indique los medicamentos, dosis, frecuencia, procedimientos realizados o plan terapéutico..."
                  className="w-full p-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Fila 4: Observaciones y Recomendaciones (Opcional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Observaciones Clínicas / Recomendaciones al Propietario
                </label>
                <textarea
                  rows="2"
                  value={notasInput}
                  onChange={(e) => setNotasInput(e.target.value)}
                  placeholder="Signos vitales adicionales, cuidados en casa, próximo control sugerido (opcional)..."
                  className="w-full p-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Fila 5: Adjuntar Fotos o PDFs al Historial Clínico */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Adjuntar Fotos o PDFs al Historial Clínico (Opcional)
                </label>
                <div
                  onClick={() => atenderFileRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-xl p-3.5 bg-slate-900/60 text-center cursor-pointer transition-colors">
                  <div className="flex items-center justify-center gap-2 text-sky-400 font-bold text-xs">
                    <UploadSimple size={17} weight="bold" />
                    <span>Seleccionar fotos (JPG, PNG, WEBP) o documentos PDF</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Exámenes de laboratorio, radiografías, ecografías o fotografías clínicas
                  </p>
                  <input
                    ref={atenderFileRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                    onChange={handleSelectArchivosAtender}
                    className="hidden"
                  />
                </div>

                {archivosInput.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                    {archivosInput.map((arch, idx) => (
                      <div
                        key={`${arch.nombre_archivo}-${idx}`}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-700 bg-slate-900">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {arch.esImagen ? (
                            <img
                              src={arch.base64_data}
                              alt={arch.nombre_archivo}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
                              <FilePdf size={18} weight="fill" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{arch.nombre_archivo}</p>
                            <p className="text-[10px] text-slate-400">{formatBytes(arch.tamano_bytes)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setArchivosInput((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800">
                          <X size={14} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => !guardandoAtencion && setCitaAtender(null)}
                  disabled={guardandoAtencion}
                  className="px-4 py-2.5 h-11 rounded-xl font-bold text-xs text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 transition-all">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoAtencion}
                  className="inline-flex items-center gap-2 px-5 py-2.5 h-11 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 transition-all active:scale-95 disabled:opacity-50">
                  {guardandoAtencion ? (
                    <>
                      <Spinner size="sm" />
                      <span>Guardando Consulta...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={17} weight="bold" />
                      <span>Finalizar Atención y Guardar en Historia Clínica</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
