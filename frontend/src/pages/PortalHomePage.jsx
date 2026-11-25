import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useFeedback } from '../context/FeedbackContext';
import Spinner from '../components/Spinner';
import { resolveArchivoUrl } from '../utils/archivos';
import {
  PawPrint,
  CalendarHeart,
  Heartbeat,
  Plus,
  ArrowRight,
  Clock,
  Stethoscope,
  X,
  Scales,
  ClipboardText,
  Sparkle,
  Heart,
} from '@phosphor-icons/react';

const ESPECIES_PICKER = [
  { value: 'Perro', emoji: '🐕', label: 'Perro' },
  { value: 'Gato', emoji: '🐈', label: 'Gato' },
  { value: 'Conejo', emoji: '🐇', label: 'Conejo' },
  { value: 'Ave', emoji: '🦜', label: 'Ave' },
  { value: 'Reptil', emoji: '🦎', label: 'Reptil' },
  { value: 'Otro', emoji: '🐾', label: 'Otro' },
];

const PET_THEMES = [
  {
    header: 'from-amber-100 via-orange-50 to-rose-50',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    ring: 'ring-amber-200/70',
    cta: 'text-amber-700',
  },
  {
    header: 'from-teal-100 via-emerald-50 to-cyan-50',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    ring: 'ring-teal-200/70',
    cta: 'text-teal-700',
  },
  {
    header: 'from-sky-100 via-blue-50 to-indigo-50',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    ring: 'ring-sky-200/70',
    cta: 'text-sky-700',
  },
  {
    header: 'from-violet-100 via-purple-50 to-fuchsia-50',
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    ring: 'ring-violet-200/70',
    cta: 'text-violet-700',
  },
];

function getEspecieEmoji(especie) {
  const e = (especie || '').toLowerCase();
  if (e.includes('perro')) return '🐕';
  if (e.includes('gato')) return '🐈';
  if (e.includes('ave')) return '🦜';
  if (e.includes('conejo')) return '🐇';
  if (e.includes('reptil')) return '🦎';
  return '🐾';
}

function getSaludo() {
  const h = new Date().getHours();
  if (h < 12) return '¡Buenos días';
  if (h < 19) return '¡Buenas tardes';
  return '¡Buenas noches';
}

function calcularEdadAmigable(fechaNac) {
  if (!fechaNac) return null;
  const nac = new Date(fechaNac);
  if (Number.isNaN(nac.getTime())) return null;
  const hoy = new Date();
  const meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
  if (meses < 1) return 'Cachorrito';
  const anios = Math.floor(meses / 12);
  if (anios === 0) return `${meses} mes${meses === 1 ? '' : 'es'}`;
  return `${anios} año${anios === 1 ? '' : 's'}`;
}

function formatDateTime(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function PortalHomePage() {
  const { notify } = useFeedback();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal agregar nueva mascota
  const [modalOpen, setModalOpen] = useState(false);
  const [petForm, setPetForm] = useState({
    nombre: '',
    especie: 'Perro',
    raza: '',
    sexo: 'Desconocido',
    fechaNacimiento: '',
    pesoKg: '',
    color: '',
  });
  const [savingPet, setSavingPet] = useState(false);
  const [petError, setPetError] = useState('');

  const loadResumen = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/portal/resumen');
      setResumen(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar tu información.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumen();
  }, [loadResumen]);

  async function handleCreatePet(e) {
    e.preventDefault();
    if (!petForm.nombre.trim() || petForm.nombre.trim().length < 2) {
      return setPetError('El nombre de tu mascota debe tener al menos 2 caracteres.');
    }
    if (!petForm.raza.trim() || petForm.raza.trim().length < 2) {
      return setPetError('Indica la raza de tu mascota (ej. Criollo, Labrador, Persa).');
    }
    try {
      setSavingPet(true);
      setPetError('');
      await api.post('/portal/mascotas', {
        ...petForm,
        pesoKg: petForm.pesoKg ? Number(petForm.pesoKg) : null,
        fechaNacimiento: petForm.fechaNacimiento || null,
      });
      notify.success(`¡Bienvenido a la familia DataVet, ${petForm.nombre.trim()}! 🐾`);
      setModalOpen(false);
      setPetForm({
        nombre: '',
        especie: 'Perro',
        raza: '',
        sexo: 'Desconocido',
        fechaNacimiento: '',
        pesoKg: '',
        color: '',
      });
      loadResumen();
    } catch (err) {
      setPetError(err.response?.data?.message || 'Error al registrar la mascota.');
    } finally {
      setSavingPet(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-bold text-teal-700">Preparando el espacio de tus peluditos...</p>
      </div>
    );
  }

  if (error || !resumen) {
    return (
      <div className="bg-white border border-rose-200 rounded-3xl p-6 text-center text-sm text-rose-700 font-semibold">
        {error || 'No se pudo cargar el portal.'}
      </div>
    );
  }

  const { perfil, mascotas, proximasCitas, hospitalizacionesActivas } = resumen;
  const nombresMascotas =
    mascotas.length === 1
      ? `${mascotas[0].nombre} está en buenas manos.`
      : mascotas.length > 1
      ? `${mascotas.slice(0, 2).map((m) => m.nombre).join(' y ')}${mascotas.length > 2 ? ' y compañía' : ''} están en buenas manos.`
      : 'Registra a tu primer peludito para empezar.';

  return (
    <div className="space-y-7">
      {/* ── HERO CÁLIDO Y ALEGRE ── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-600 via-emerald-600 to-sky-600 text-white p-6 sm:p-8 shadow-xl shadow-teal-900/15">
        {/* Decoración sutil de huellitas */}
        <PawPrint
          size={150}
          weight="fill"
          className="absolute -right-6 -bottom-8 text-white/10 rotate-[-18deg] pointer-events-none"
        />
        <Sparkle
          size={72}
          weight="fill"
          className="absolute right-28 top-4 text-amber-300/20 pointer-events-none hidden sm:block"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-extrabold tracking-wide">
              <Heart size={13} weight="fill" className="text-amber-300" />
              <span>Portal de Propietarios DataVet</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getSaludo()}, {perfil.nombre}! 🐾
            </h1>
            <p className="text-sm text-teal-50 font-medium max-w-xl">
              {nombresMascotas} Aquí puedes revisar sus carnets de salud, recetas y agendar consultas en segundos.
            </p>

            {/* Resumen rápido en píldoras */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-xl bg-white/15 text-xs font-bold">
                🐾 {mascotas.length} {mascotas.length === 1 ? 'mascota' : 'mascotas'}
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/15 text-xs font-bold">
                📅 {proximasCitas.length} {proximasCitas.length === 1 ? 'cita próxima' : 'citas próximas'}
              </span>
              {hospitalizacionesActivas.length > 0 && (
                <span className="px-3 py-1 rounded-xl bg-amber-400/25 border border-amber-300/40 text-amber-100 text-xs font-extrabold">
                  💛 {hospitalizacionesActivas.length} en observación clínica
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 h-11 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-extrabold backdrop-blur-xs transition-all active:scale-95"
            >
              <Plus size={16} weight="bold" />
              <span>Nueva Mascota</span>
            </button>
            <Link
              to="/portal/citas?agendar=1"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 h-11 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-extrabold shadow-lg shadow-amber-950/20 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              <CalendarHeart size={17} weight="fill" />
              <span>Agendar Cita</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── AVISO EMPÁTICO DE HOSPITALIZACIÓN ACTIVA ── */}
      {hospitalizacionesActivas.length > 0 && (
        <div className="space-y-3">
          {hospitalizacionesActivas.map((h) => (
            <div
              key={h.id}
              className="rounded-3xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/70 p-5 flex items-center justify-between flex-wrap gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Heartbeat size={24} weight="fill" className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-extrabold text-amber-950">
                      Estamos cuidando mucho a {h.mascota_nombre} 💛
                    </p>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-extrabold uppercase">
                      En observación
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/90 mt-1">
                    Atendido por <strong>Dr(a). {h.veterinario_nombre}</strong> • {h.motivo}
                  </p>
                </div>
              </div>
              <Link
                to={`/portal/mascotas/${h.mascota_id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-xs transition-all"
              >
                <span>Ver evolución</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── PRÓXIMA CITA DESTACADA ── */}
      {proximasCitas.length > 0 && (
        <div className="bg-white border border-teal-100 rounded-3xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 to-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
              <Clock size={24} weight="duotone" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-teal-600">
                <span>Próxima visita • {proximasCitas[0].estado_detalle}</span>
              </span>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                {getEspecieEmoji(proximasCitas[0].especie)} {proximasCitas[0].mascota_nombre} —{' '}
                <span className="text-teal-700">{formatDateTime(proximasCitas[0].fecha_hora)}</span>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Stethoscope size={13} className="text-teal-600" />
                <span>Dr(a). {proximasCitas[0].veterinario_nombre}</span>
                <span>•</span>
                <span>{proximasCitas[0].motivo}</span>
              </p>
            </div>
          </div>

          <Link
            to="/portal/citas"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-extrabold transition-all"
          >
            <span>Ver mis citas ({proximasCitas.length})</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      )}

      {/* ── TARJETAS PASTEL DE MIS MASCOTAS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>Tus Peluditos</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
              {mascotas.length}
            </span>
          </h2>
        </div>

        {mascotas.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-amber-200 rounded-3xl p-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-3xl flex items-center justify-center mx-auto">
              🐶🐱
            </div>
            <p className="text-base font-extrabold text-slate-900">
              ¡Agrega a tu primera mascota!
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Crea su carnet digital de salud para agendar citas, guardar sus recetas y llevar el control de sus visitas al veterinario.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm transition-all"
            >
              <Plus size={16} weight="bold" />
              <span>Registrar mi primera mascota</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mascotas.map((m, idx) => {
              const theme = PET_THEMES[idx % PET_THEMES.length];
              const edad = calcularEdadAmigable(m.fechaNacimiento);
              return (
                <Link
                  key={m.id}
                  to={`/portal/mascotas/${m.id}`}
                  className="group bg-white border border-slate-200/80 hover:border-teal-300 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:shadow-teal-900/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Cabecera pastel de la mascota */}
                  <div className={`bg-gradient-to-br ${theme.header} p-5 flex items-center gap-4`}>
                    {m.fotoUrl ? (
                      <img
                        src={resolveArchivoUrl(m.fotoUrl)}
                        alt={m.nombre}
                        className={`w-16 h-16 rounded-2xl object-cover ring-4 ${theme.ring} shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-2xl bg-white/90 ring-4 ${theme.ring} flex items-center justify-center text-3xl flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
                      >
                        {getEspecieEmoji(m.especie)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-lg font-extrabold text-slate-900 truncate">
                        {m.nombre}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 truncate">
                        {m.raza || m.especie}
                      </p>
                      <span
                        className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase ${theme.badge}`}
                      >
                        {m.especie}
                      </span>
                    </div>
                  </div>

                  {/* Detalles rápidos */}
                  <div className="p-5 pt-4 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {edad && (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold">
                          🎂 {edad}
                        </span>
                      )}
                      {m.pesoKg && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold">
                          <Scales size={12} />
                          {m.pesoKg} kg
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        <ClipboardText size={12} />
                        {m.totalConsultas || 0} visita{Number(m.totalConsultas) === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className={`pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold ${theme.cta}`}>
                      <span>Abrir carnet y recetas</span>
                      <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL AGREGAR NUEVA MASCOTA (CENTRADO CON MARGEN SEGURO EN MÓVIL) ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-white border border-amber-100 rounded-3xl shadow-2xl overflow-hidden max-h-[86vh] flex flex-col">
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-teal-50 to-amber-50 border-b border-amber-100 flex items-center justify-between flex-shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="font-extrabold text-base text-slate-900 truncate">
                  ¡Cuéntanos sobre tu mascota! 🐾
                </h3>
                <p className="text-xs text-slate-500">Crearemos su carnet digital al instante</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-white/80 flex items-center justify-center text-slate-500 flex-shrink-0"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleCreatePet} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {petError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {petError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    ¿Cómo se llama? *
                  </label>
                  <input
                    type="text"
                    value={petForm.nombre}
                    onChange={(e) => setPetForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej. Toby, Luna, Copito..."
                    className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-semibold focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    ¿Qué especie es? *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ESPECIES_PICKER.map((esp) => {
                      const active = petForm.especie === esp.value;
                      return (
                        <button
                          key={esp.value}
                          type="button"
                          onClick={() => setPetForm((f) => ({ ...f, especie: esp.value }))}
                          className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl border-2 text-xs font-extrabold transition-all active:scale-95 ${
                            active
                              ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'
                          }`}
                        >
                          <span className="text-xl">{esp.emoji}</span>
                          <span>{esp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Raza *</label>
                    <input
                      type="text"
                      value={petForm.raza}
                      onChange={(e) => setPetForm((f) => ({ ...f, raza: e.target.value }))}
                      placeholder="Ej. Criollo, Labrador..."
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Sexo</label>
                    <select
                      value={petForm.sexo}
                      onChange={(e) => setPetForm((f) => ({ ...f, sexo: e.target.value }))}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                    >
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                      <option value="Desconocido">Desconocido</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Peso aprox. (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="300"
                      value={petForm.pesoKg}
                      onChange={(e) => setPetForm((f) => ({ ...f, pesoKg: e.target.value }))}
                      placeholder="Ej. 8.5"
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Color</label>
                    <input
                      type="text"
                      value={petForm.color}
                      onChange={(e) => setPetForm((f) => ({ ...f, color: e.target.value }))}
                      placeholder="Ej. Dorado"
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Cumpleaños / Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    value={petForm.fechaNacimiento}
                    onChange={(e) => setPetForm((f) => ({ ...f, fechaNacimiento: e.target.value }))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 sm:flex items-center justify-end gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto px-4 h-11 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPet}
                  className="w-full sm:w-auto px-4 sm:px-5 h-11 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm disabled:opacity-50"
                >
                  {savingPet ? 'Guardando...' : 'Guardar Mascota 🐾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
