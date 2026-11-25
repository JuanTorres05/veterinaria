import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { useFeedback } from '../context/FeedbackContext';
import Spinner from '../components/Spinner';
import RecetaFormSection from '../components/RecetaFormSection';
import {
  resolveArchivoUrl,
  formatBytes,
  leerArchivosParaSubida,
} from '../utils/archivos';
import {
  ArrowLeft,
  ArrowRight,
  Stethoscope,
  ClipboardText,
  Prescription,
  Paperclip,
  FirstAidKit,
  CheckCircle,
  WarningCircle,
  Scales,
  Clock,
  User,
  Phone,
  Envelope,
  MapPin,
  IdentificationBadge,
  GenderIntersex,
  CalendarBlank,
  UploadSimple,
  FilePdf,
  X,
  CaretDown,
  CaretUp,
  NotePencil,
  PawPrint,
  Heartbeat,
  Sparkle,
} from '@phosphor-icons/react';

function getEspecieEmoji(especie) {
  const esp = (especie || '').toLowerCase();
  if (esp.includes('perro') || esp.includes('can')) return '🐕';
  if (esp.includes('gato') || esp.includes('fel')) return '🐈';
  if (esp.includes('ave') || esp.includes('pajaro')) return '🦜';
  if (esp.includes('conejo')) return '🐇';
  if (esp.includes('reptil') || esp.includes('tortuga') || esp.includes('iguana')) return '🦎';
  return '🐾';
}

function calcularEdad(fechaNac) {
  if (!fechaNac) return 'No registrada';
  const nac = new Date(fechaNac);
  if (Number.isNaN(nac.getTime())) return 'No registrada';
  const hoy = new Date();
  let meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
  if (meses < 0) return 'Recién nacido';
  const anios = Math.floor(meses / 12);
  const restoMeses = meses % 12;
  if (anios === 0) return `${restoMeses || 1} mes${restoMeses === 1 ? '' : 'es'}`;
  if (restoMeses === 0) return `${anios} año${anios === 1 ? '' : 's'}`;
  return `${anios}a ${restoMeses}m`;
}

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTime(str) {
  if (!str) return '';
  return new Date(str).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const SECCIONES = [
  { id: 'evaluacion', label: '1. Evaluación Clínica', icon: Stethoscope },
  { id: 'receta', label: '2. Receta Médica', icon: Prescription },
  { id: 'soportes', label: '3. Soportes y Hospitalización', icon: Paperclip },
];

export default function AtenderCitaPage() {
  const { citaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useFeedback();

  const returnTo = location.state?.from || '/agenda';

  const [cita, setCita] = useState(location.state?.cita || null);
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Sección activa del espacio de consulta
  const [seccionActiva, setSeccionActiva] = useState('evaluacion');
  const [expandedHistorialId, setExpandedHistorialId] = useState(null);

  // Cronómetro de consulta en vivo
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Estado del registro clínico
  const [sintomasInput, setSintomasInput] = useState('');
  const [pesoInput, setPesoInput] = useState('');
  const [diagnosticoInput, setDiagnosticoInput] = useState('');
  const [tratamientoInput, setTratamientoInput] = useState('');
  const [notasInput, setNotasInput] = useState('');
  const [requiereHosp, setRequiereHosp] = useState(false);
  const [recetaMeds, setRecetaMeds] = useState([]);
  const [indicacionesReceta, setIndicacionesReceta] = useState('');
  const [archivosInput, setArchivosInput] = useState([]);

  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [atencionCompletada, setAtencionCompletada] = useState(null);

  const fileInputRef = useRef(null);

  // Cargar datos completos de la cita y del paciente
  useEffect(() => {
    let active = true;

    async function cargarDatos() {
      setLoading(true);
      setLoadError('');
      try {
        const citaRes = await api.get(`/citas/${citaId}`);
        if (!active) return;
        const citaData = citaRes.data;
        setCita(citaData);
        setSintomasInput((prev) => prev || citaData.motivo || '');

        if (citaData?.mascota_id) {
          const mascotaRes = await api.get(`/mascotas/${citaData.mascota_id}`);
          if (!active) return;
          setMascota(mascotaRes.data);
          if (mascotaRes.data?.historial?.length > 0) {
            setExpandedHistorialId(mascotaRes.data.historial[0].id);
          }
        }
      } catch (err) {
        if (!active) return;
        setLoadError(
          err.response?.data?.message || 'No se pudo cargar la información de la cita.'
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    cargarDatos();
    return () => {
      active = false;
    };
  }, [citaId]);

  // Cronómetro de consulta mientras está activa
  useEffect(() => {
    if (loading || loadError || atencionCompletada || cita?.estado !== 'pendiente') return;
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, loadError, atencionCompletada, cita?.estado]);

  // Comparativa de peso actual vs registrado
  const variacionPeso = useMemo(() => {
    const actual = Number(pesoInput);
    const anterior = Number(mascota?.pesoKg);
    if (!pesoInput || Number.isNaN(actual) || !anterior || Number.isNaN(anterior)) return null;
    const diff = Number((actual - anterior).toFixed(2));
    return diff;
  }, [pesoInput, mascota?.pesoKg]);

  const hospitalizacionActiva = useMemo(
    () => (mascota?.hospitalizaciones || []).find((h) => h.estado === 'Activa'),
    [mascota?.hospitalizaciones]
  );

  const sintomasOk = sintomasInput.trim().length >= 3;
  const diagnosticoOk = diagnosticoInput.trim().length >= 3;
  const tratamientoOk = tratamientoInput.trim().length >= 3;
  const evaluacionCompleta = sintomasOk && diagnosticoOk && tratamientoOk;

  const handleSelectArchivos = async (e) => {
    try {
      const nuevos = await leerArchivosParaSubida(e.target.files);
      setArchivosInput((prev) => [...prev, ...nuevos].slice(0, 10));
      setErrorForm('');
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cita) return;

    if (!sintomasOk) {
      setSeccionActiva('evaluacion');
      return setErrorForm('Los síntomas o motivo de consulta deben tener al menos 3 caracteres.');
    }
    if (!diagnosticoOk) {
      setSeccionActiva('evaluacion');
      return setErrorForm('El diagnóstico médico es obligatorio (mínimo 3 caracteres).');
    }
    if (!tratamientoOk) {
      setSeccionActiva('evaluacion');
      return setErrorForm('El tratamiento o prescripción es obligatorio (mínimo 3 caracteres).');
    }
    if (recetaMeds.some((m) => !m.id_medicamento || !m.dosis.trim())) {
      setSeccionActiva('receta');
      return setErrorForm(
        'Completa el medicamento y la dosis en cada fila de la receta (o quita las filas vacías).'
      );
    }

    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = new Date(Date.now() - tzOffset).toISOString().slice(0, 19);

    try {
      setGuardando(true);
      setErrorForm('');
      await api.post(`/mascotas/${cita.mascota_id}/historial`, {
        cita_id: cita.id,
        fecha: localISOTime,
        motivo: sintomasInput.trim(),
        diagnostico: diagnosticoInput.trim(),
        tratamiento: tratamientoInput.trim(),
        notas: notasInput.trim() || null,
        peso_kg: pesoInput !== '' ? Number(pesoInput) : null,
        requiere_hospitalizacion: requiereHosp,
        receta:
          recetaMeds.length > 0
            ? {
                indicaciones_generales: indicacionesReceta.trim() || null,
                medicamentos: recetaMeds.map((m) => ({
                  id_medicamento: Number(m.id_medicamento),
                  dosis: m.dosis.trim(),
                  frecuencia: m.frecuencia.trim() || null,
                  duracion: m.duracion.trim() || null,
                  instrucciones: m.instrucciones.trim() || null,
                })),
              }
            : null,
        archivos: archivosInput,
      });

      notify.success(`Consulta clínica de ${cita.mascota_nombre} guardada correctamente.`);
      setAtencionCompletada({
        mascotaNombre: cita.mascota_nombre,
        mascotaId: cita.mascota_id,
        diagnostico: diagnosticoInput.trim(),
        requiereHosp,
        totalMeds: recetaMeds.length,
        totalArchivos: archivosInput.length,
        duracion: formatDuration(elapsedSeconds),
      });
    } catch (err) {
      setErrorForm(err.response?.data?.message || 'Error al registrar la consulta clínica.');
    } finally {
      setGuardando(false);
    }
  };

  const currentIndex = SECCIONES.findIndex((s) => s.id === seccionActiva);
  const irAnterior = () => {
    if (currentIndex > 0) setSeccionActiva(SECCIONES[currentIndex - 1].id);
  };
  const irSiguiente = () => {
    if (currentIndex < SECCIONES.length - 1) setSeccionActiva(SECCIONES[currentIndex + 1].id);
  };

  // ── Estado: Cargando ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">
          Preparando espacio de consulta y cargando expediente del paciente...
        </p>
      </div>
    );
  }

  // ── Estado: Error de carga ─────────────────────────────────────────────────
  if (loadError || !cita) {
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <WarningCircle size={26} weight="bold" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">No se pudo abrir la consulta</h2>
        <p className="text-sm text-slate-500 mt-1">{loadError || 'La cita no fue encontrada.'}</p>
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Volver</span>
        </button>
      </div>
    );
  }

  // ── Estado: Atención Finalizada con Éxito ──────────────────────────────────
  if (atencionCompletada) {
    return (
      <div className="max-w-2xl mx-auto mt-6 bg-white border border-emerald-200 rounded-3xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
              <CheckCircle size={28} weight="fill" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Consulta Registrada • Duración {atencionCompletada.duracion}
              </p>
              <h1 className="text-xl font-extrabold tracking-tight">
                Atención de {atencionCompletada.mascotaNombre} finalizada
              </h1>
            </div>
          </div>
        </div>

        <div className="p-7 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Diagnóstico registrado
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {atencionCompletada.diagnostico}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                Historia clínica actualizada
              </span>
              {atencionCompletada.totalMeds > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 text-xs font-bold">
                  {atencionCompletada.totalMeds} medicamento(s) en receta
                </span>
              )}
              {atencionCompletada.totalArchivos > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold">
                  {atencionCompletada.totalArchivos} soporte(s) adjuntos
                </span>
              )}
              {atencionCompletada.requiereHosp && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">
                  Ingreso a Hospitalización creado
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(returnTo)}
              className="px-4 py-2.5 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              Volver a {returnTo === '/monitoreo' ? 'Sala de Espera' : 'Agenda'}
            </button>
            {atencionCompletada.requiereHosp && (
              <Link
                to="/hospitalizacion"
                className="inline-flex items-center gap-2 px-4 py-2.5 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all"
              >
                <FirstAidKit size={16} weight="bold" />
                <span>Ir a Hospitalización</span>
              </Link>
            )}
            <Link
              to={`/mascotas/${atencionCompletada.mascotaId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-sm transition-all"
            >
              <ClipboardText size={16} weight="bold" />
              <span>Ver Expediente Completo</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Estado: Cita ya no está pendiente ──────────────────────────────────────
  const citaNoPendiente = cita.estado !== 'pendiente';
  const fotoUrl = mascota?.fotoUrl ? resolveArchivoUrl(mascota.fotoUrl) : null;
  const historial = mascota?.historial || [];

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 pb-10">
      {/* ── BARRA SUPERIOR DEL CONSULTORIO ─────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0F172A] text-white border border-slate-800 px-5 py-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate(returnTo)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center transition-all flex-shrink-0"
              title="Volver"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Stethoscope size={22} weight="bold" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white truncate">
                  Espacio de Consulta Clínica
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                  Cita #{cita.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {formatTime(cita.fecha_hora)} • Dr(a). {cita.veterinario_nombre} • Motivo agendado:{' '}
                <span className="text-slate-200 font-semibold">{cita.motivo || 'Consulta general'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {!citaNoPendiente && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Clock size={14} weight="bold" />
                <span>En consulta · {formatDuration(elapsedSeconds)}</span>
              </div>
            )}

            <Link
              to={`/mascotas/${cita.mascota_id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs font-bold transition-all"
            >
              <ClipboardText size={15} weight="bold" />
              <span>Ver Expediente Completo</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── AVISO SI LA CITA YA FUE ATENDIDA O CANCELADA ───────────────────── */}
      {citaNoPendiente && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <WarningCircle size={22} weight="bold" className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-amber-900">
                Esta cita se encuentra en estado &quot;{cita.estado_detalle || cita.estado}&quot;
              </p>
              <p className="text-xs text-amber-800">
                Solo las citas pendientes pueden recibir un nuevo registro de atención médica.
              </p>
            </div>
          </div>
          <Link
            to={`/mascotas/${cita.mascota_id}`}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all"
          >
            Ir al Expediente
          </Link>
        </div>
      )}

      {/* ── LAYOUT PRINCIPAL DE 2 COLUMNAS (CONSULTORIO) ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ══ COLUMNA IZQUIERDA: CONTEXTO DEL PACIENTE Y ANTECEDENTES ══════ */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Tarjeta de Identidad del Paciente */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3.5">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={mascota?.nombre || cita.mascota_nombre}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-3xl flex-shrink-0">
                  {getEspecieEmoji(mascota?.especie || cita.especie)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-extrabold text-slate-900 truncate">
                    {mascota?.nombre || cita.mascota_nombre}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 text-[10px] font-extrabold uppercase">
                    {mascota?.especie || cita.especie}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                  {mascota?.raza || 'Raza no registrada'}
                  {mascota?.color ? ` • ${mascota.color}` : ''}
                </p>
              </div>
            </div>

            {/* Datos biométricos rápidos */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Scales size={12} /> Peso registrado
                </span>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                  {mascota?.pesoKg ? `${mascota.pesoKg} kg` : 'Sin registro'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <CalendarBlank size={12} /> Edad
                </span>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                  {calcularEdad(mascota?.fechaNacimiento)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <GenderIntersex size={12} /> Sexo
                </span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {mascota?.sexo || 'Desconocido'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <IdentificationBadge size={12} /> Microchip
                </span>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {mascota?.microchip || 'No asignado'}
                </p>
              </div>
            </div>

            {/* Observaciones permanentes de la mascota */}
            {mascota?.observaciones && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 mb-0.5">
                  Notas del Paciente
                </p>
                <p className="text-xs text-amber-900 leading-relaxed">{mascota.observaciones}</p>
              </div>
            )}

            {/* Aviso de Hospitalización Activa */}
            {hospitalizacionActiva && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5">
                <Heartbeat size={18} weight="bold" className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-rose-800">
                    Paciente actualmente hospitalizado
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    {hospitalizacionActiva.motivo}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta del Propietario */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <User size={14} weight="bold" className="text-sky-600" />
              <span>Propietario</span>
            </div>
            <p className="text-sm font-extrabold text-slate-900">
              {mascota?.cliente?.nombre || cita.cliente_nombre}
            </p>
            <div className="space-y-1.5 text-xs text-slate-600">
              {(mascota?.cliente?.telefono || cita.telefono) && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" />
                  <span>{mascota?.cliente?.telefono || cita.telefono}</span>
                </div>
              )}
              {mascota?.cliente?.correo && (
                <div className="flex items-center gap-2 truncate">
                  <Envelope size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{mascota.cliente.correo}</span>
                </div>
              )}
              {mascota?.cliente?.direccion && (
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                  <span>{mascota.cliente.direccion}</span>
                </div>
              )}
            </div>
          </div>

          {/* Antecedentes Clínicos Recientes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <ClipboardText size={15} weight="bold" className="text-emerald-600" />
                <span>Antecedentes Clínicos</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                {historial.length}
              </span>
            </div>

            {historial.length === 0 ? (
              <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-4 text-center">
                <PawPrint size={20} className="text-slate-300 mx-auto mb-1" />
                <p className="text-xs text-slate-500 font-medium">
                  Primera consulta registrada para este paciente.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {historial.slice(0, 6).map((item) => {
                  const isOpen = expandedHistorialId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedHistorialId(isOpen ? null : item.id)}
                        className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-slate-100/80 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-800 truncate">
                            {item.motivo || 'Consulta médica'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {formatDateTime(item.fecha)}
                          </p>
                        </div>
                        {isOpen ? (
                          <CaretUp size={14} className="text-slate-400 flex-shrink-0" />
                        ) : (
                          <CaretDown size={14} className="text-slate-400 flex-shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-200/70 bg-white space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400">
                              Diagnóstico
                            </span>
                            <p className="text-slate-700 font-medium">{item.diagnostico}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400">
                              Tratamiento
                            </span>
                            <p className="text-slate-700">{item.tratamiento}</p>
                          </div>
                          {item.recetas?.length > 0 && (
                            <div className="pt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                <Prescription size={11} />
                                {item.recetas.reduce(
                                  (acc, r) => acc + (r.medicamentos?.length || 0),
                                  0
                                )}{' '}
                                medicamento(s) recetado(s)
                              </span>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 pt-0.5">
                            Atendido por: {item.veterinario_nombre}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ══ COLUMNA DERECHA: ESTACIÓN DE REGISTRO CLÍNICO ════════════════ */}
        <section className="lg:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col"
          >
            {/* Navegación por Módulos de la Consulta */}
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 pt-3.5 pb-0">
              <div className="flex items-center gap-2 overflow-x-auto">
                {SECCIONES.map((sec) => {
                  const Icon = sec.icon;
                  const active = seccionActiva === sec.id;
                  let badge = null;
                  if (sec.id === 'evaluacion' && evaluacionCompleta) {
                    badge = (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Completo" />
                    );
                  } else if (sec.id === 'receta' && recetaMeds.length > 0) {
                    badge = (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">
                        {recetaMeds.length}
                      </span>
                    );
                  } else if (
                    sec.id === 'soportes' &&
                    (archivosInput.length > 0 || requiereHosp)
                  ) {
                    badge = (
                      <span className="px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-extrabold">
                        {archivosInput.length + (requiereHosp ? 1 : 0)}
                      </span>
                    );
                  }

                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSeccionActiva(sec.id)}
                      className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-extrabold whitespace-nowrap border-b-2 transition-all ${
                        active
                          ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 rounded-t-xl'
                      }`}
                    >
                      <Icon size={16} weight={active ? 'fill' : 'regular'} />
                      <span>{sec.label}</span>
                      {badge}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alerta de Error de Validación / Servidor */}
            {errorForm && (
              <div className="mx-6 mt-5 flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">
                <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-500" />
                <span>{errorForm}</span>
              </div>
            )}

            {/* Cuerpo de la Sección Activa */}
            <div className="p-6 space-y-5 min-h-[430px]">
              {/* ── MÓDULO 1: EVALUACIÓN CLÍNICA ─────────────────────────── */}
              {seccionActiva === 'evaluacion' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Evaluación y Hallazgos Clínicos
                      </h3>
                      <p className="text-xs text-slate-500">
                        Documenta los síntomas, el peso actual, el diagnóstico y el plan terapéutico.
                      </p>
                    </div>
                  </div>

                  {/* Fila: Síntomas + Peso */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Síntomas / Motivo de Consulta <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={citaNoPendiente}
                        value={sintomasInput}
                        onChange={(e) => setSintomasInput(e.target.value)}
                        placeholder="Síntomas presentados o motivo de la atención..."
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all disabled:opacity-60"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Peso en Consulta (kg)
                      </label>
                      <div className="relative">
                        <Scales
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="500"
                          disabled={citaNoPendiente}
                          value={pesoInput}
                          onChange={(e) => setPesoInput(e.target.value)}
                          placeholder={mascota?.pesoKg ? `Anterior: ${mascota.pesoKg}` : 'Ej. 12.5'}
                          className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all disabled:opacity-60"
                        />
                      </div>
                      {variacionPeso !== null && (
                        <p
                          className={`text-[11px] font-bold mt-1 ${
                            variacionPeso === 0
                              ? 'text-slate-500'
                              : variacionPeso > 0
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {variacionPeso === 0
                            ? 'Sin variación respecto al peso registrado'
                            : `${variacionPeso > 0 ? '+' : ''}${variacionPeso} kg respecto al último peso`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Diagnóstico Médico */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Diagnóstico Médico <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows="3"
                      disabled={citaNoPendiente}
                      value={diagnosticoInput}
                      onChange={(e) => setDiagnosticoInput(e.target.value)}
                      placeholder="Describa el diagnóstico clínico o hallazgos del examen físico..."
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all resize-y disabled:opacity-60"
                    />
                  </div>

                  {/* Tratamiento y Plan Terapéutico */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Tratamiento y Medicación Aplicada / Plan Terapéutico{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows="4"
                      disabled={citaNoPendiente}
                      value={tratamientoInput}
                      onChange={(e) => setTratamientoInput(e.target.value)}
                      placeholder="Indique procedimientos realizados, medicación aplicada en consultorio y plan terapéutico..."
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all resize-y disabled:opacity-60"
                    />
                  </div>

                  {/* Observaciones al Propietario */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <NotePencil size={14} className="text-slate-400" />
                      <span>Observaciones Clínicas / Recomendaciones al Propietario</span>
                    </label>
                    <textarea
                      rows="2"
                      disabled={citaNoPendiente}
                      value={notasInput}
                      onChange={(e) => setNotasInput(e.target.value)}
                      placeholder="Signos vitales adicionales, cuidados en casa, dieta o próximo control sugerido (opcional)..."
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all resize-y disabled:opacity-60"
                    />
                  </div>
                </div>
              )}

              {/* ── MÓDULO 2: RECETA MÉDICA ──────────────────────────────── */}
              {seccionActiva === 'receta' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Prescripción y Receta Médica
                    </h3>
                    <p className="text-xs text-slate-500">
                      Opcional. Los medicamentos agregados quedarán estructurados en el expediente y disponibles para impresión.
                    </p>
                  </div>

                  <RecetaFormSection
                    variant="light"
                    recetaMeds={recetaMeds}
                    setRecetaMeds={setRecetaMeds}
                    indicacionesReceta={indicacionesReceta}
                    setIndicacionesReceta={setIndicacionesReceta}
                  />
                </div>
              )}

              {/* ── MÓDULO 3: SOPORTES Y HOSPITALIZACIÓN ─────────────────── */}
              {seccionActiva === 'soportes' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Soportes Diagnósticos e Internación
                    </h3>
                    <p className="text-xs text-slate-500">
                      Adjunta resultados de laboratorio o imágenes clínicas y define si el paciente requiere hospitalización.
                    </p>
                  </div>

                  {/* Carga de archivos */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Adjuntar Fotos o PDFs al Historial Clínico (Opcional)
                    </label>
                    <div
                      onClick={() => !citaNoPendiente && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 bg-slate-50/70 hover:bg-sky-50/40 text-center cursor-pointer transition-all"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2.5">
                        <UploadSimple size={22} weight="bold" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        Seleccionar fotos (JPG, PNG, WEBP) o documentos PDF
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Exámenes de laboratorio, radiografías, ecografías o fotografías clínicas (máx. 10 archivos)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        onChange={handleSelectArchivos}
                        className="hidden"
                      />
                    </div>

                    {archivosInput.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
                        {archivosInput.map((arch, idx) => (
                          <div
                            key={`${arch.nombre_archivo}-${idx}`}
                            className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white shadow-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {arch.esImagen ? (
                                <img
                                  src={arch.base64_data}
                                  alt={arch.nombre_archivo}
                                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                                  <FilePdf size={20} weight="fill" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {arch.nombre_archivo}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {formatBytes(arch.tamano_bytes)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setArchivosInput((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <X size={15} weight="bold" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tarjeta interactiva de Hospitalización */}
                  <div className="pt-2">
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        requiereHosp
                          ? 'border-amber-400 bg-amber-50/70'
                          : 'border-slate-200 bg-slate-50/60 hover:border-sky-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={citaNoPendiente}
                        checked={requiereHosp}
                        onChange={(e) => setRequiereHosp(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded accent-amber-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FirstAidKit
                            size={18}
                            weight="bold"
                            className={requiereHosp ? 'text-amber-600' : 'text-slate-500'}
                          />
                          <span className="text-sm font-extrabold text-slate-900">
                            Requiere hospitalización / internación
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Al finalizar la consulta, el paciente ingresará automáticamente al módulo de{' '}
                          <strong>Hospitalización</strong> vinculado a este registro clínico.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* ── BARRA INFERIOR DE PROGRESO Y FINALIZACIÓN ──────────────── */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              {/* Checklist rápido de campos obligatorios */}
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Requisitos:
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-bold ${
                    sintomasOk ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle size={14} weight={sintomasOk ? 'fill' : 'regular'} />
                  Síntomas
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-bold ${
                    diagnosticoOk ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle size={14} weight={diagnosticoOk ? 'fill' : 'regular'} />
                  Diagnóstico
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-bold ${
                    tratamientoOk ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle size={14} weight={tratamientoOk ? 'fill' : 'regular'} />
                  Tratamiento
                </span>
              </div>

              {/* Botones de navegación y guardado */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={irAnterior}
                    className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
                  >
                    <ArrowLeft size={15} weight="bold" />
                    <span>Anterior</span>
                  </button>
                )}

                {currentIndex < SECCIONES.length - 1 && (
                  <button
                    type="button"
                    onClick={irSiguiente}
                    className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition-all"
                  >
                    <span>Siguiente</span>
                    <ArrowRight size={15} weight="bold" />
                  </button>
                )}

                {!citaNoPendiente && (
                  <button
                    type="submit"
                    disabled={guardando}
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-950/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {guardando ? (
                      <>
                        <Spinner size="sm" />
                        <span>Guardando Consulta...</span>
                      </>
                    ) : (
                      <>
                        <Sparkle size={16} weight="fill" />
                        <span>Finalizar Atención y Guardar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
