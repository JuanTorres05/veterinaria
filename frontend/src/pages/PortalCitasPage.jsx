import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useFeedback } from '../context/FeedbackContext';
import Spinner from '../components/Spinner';
import {
  CalendarHeart,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  Stethoscope,
  X,
  WarningCircle,
  SunHorizon,
  Sun,
} from '@phosphor-icons/react';

const MOTIVOS_RAPIDOS = [
  { label: 'Vacunación', emoji: '💉', text: 'Control de vacunación anual' },
  { label: 'Chequeo general', emoji: '🩺', text: 'Consulta de chequeo general' },
  { label: 'Piel / Alergias', emoji: '🛁', text: 'Revisión dermatológica / picazón' },
  { label: 'Limpieza dental', emoji: '🦷', text: 'Valoración y limpieza dental' },
  { label: 'Desparasitación', emoji: '💊', text: 'Control de desparasitación' },
  { label: 'Malestar', emoji: '🚨', text: 'Decaimiento o malestar general' },
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

function formatDateTime(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

const todayStr = (() => {
  const t = new Date();
  return new Date(t - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
})();

export default function PortalCitasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { notify, promptInput } = useFeedback();

  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  // Modal de Agendamiento Directo
  const [modalOpen, setModalOpen] = useState(searchParams.get('agendar') === '1');
  const [mascotaId, setMascotaId] = useState('');
  const [veterinarioId, setVeterinarioId] = useState('');
  const [fecha, setFecha] = useState(todayStr);
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [citasRes, resumenRes, vetsRes] = await Promise.all([
        api.get('/portal/citas'),
        api.get('/portal/resumen'),
        api.get('/auth/veterinarios'),
      ]);
      setCitas(citasRes.data || []);
      const pets = resumenRes.data?.mascotas || [];
      setMascotas(pets);
      const vets = vetsRes.data || [];
      setVeterinarios(vets);
      if (pets.length && !mascotaId) setMascotaId(String(pets[0].id));
      if (vets.length && !veterinarioId) setVeterinarioId(String(vets[0].id));
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error al cargar tus citas.');
    } finally {
      setLoading(false);
    }
  }, [mascotaId, veterinarioId, notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!modalOpen || !veterinarioId || !fecha) return;
    let active = true;
    setLoadingSlots(true);
    setHora('');
    api
      .get(`/portal/disponibilidad?veterinarioId=${veterinarioId}&fecha=${fecha}`)
      .then((res) => {
        if (active) setSlots(res.data?.slots || []);
      })
      .catch(() => {
        if (active) setSlots([]);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [modalOpen, veterinarioId, fecha]);

  function openModal() {
    setFormError('');
    setMotivo('');
    setHora('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    if (searchParams.get('agendar')) {
      setSearchParams({});
    }
  }

  async function handleAgendar(e) {
    e.preventDefault();
    if (!mascotaId) return setFormError('Elige a cuál de tus peluditos vamos a atender.');
    if (!veterinarioId) return setFormError('Selecciona un veterinario.');
    if (!fecha || !hora) return setFormError('Elige una fecha y un horario disponible.');
    if (!motivo.trim() || motivo.trim().length < 3) {
      return setFormError('Cuéntanos brevemente el motivo de la visita.');
    }

    try {
      setSaving(true);
      setFormError('');
      await api.post('/portal/citas', {
        mascota_id: Number(mascotaId),
        veterinario_id: Number(veterinarioId),
        fecha_hora: `${fecha} ${hora}:00`,
        motivo: motivo.trim(),
      });
      notify.success('¡Listo! Tu cita quedó agendada. ¡Los esperamos! 🐾');
      closeModal();
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'No se pudo agendar la cita.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmar(id) {
    try {
      setActionId(id);
      await api.patch(`/portal/citas/${id}/confirmar`);
      notify.success('¡Asistencia confirmada! Te esperamos con mucho cariño 🐾');
      loadData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'No se pudo confirmar la cita.');
    } finally {
      setActionId(null);
    }
  }

  async function handleCancelar(cita) {
    const motivoCancelacion = await promptInput({
      title: 'Cancelar cita',
      message: `Cuéntanos el motivo por el cual cancelas la cita de ${cita.mascota_nombre} (${formatDateTime(cita.fecha_hora)}):`,
      placeholder: 'Ej. No puedo asistir en ese horario, reprogramaré para otro día...',
      confirmLabel: 'Confirmar cancelación',
    });
    if (motivoCancelacion === null) return;
    if (motivoCancelacion.trim().length < 3) {
      return notify.error('Por favor ingresa un motivo de cancelación (mínimo 3 caracteres).');
    }
    try {
      setActionId(cita.id);
      await api.patch(`/portal/citas/${cita.id}/cancelar`, {
        motivo_cancelacion: motivoCancelacion.trim(),
      });
      notify.info('La cita fue cancelada.');
      loadData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'No se pudo cancelar la cita.');
    } finally {
      setActionId(null);
    }
  }

  const pendientes = citas
    .filter((c) => c.estado === 'pendiente')
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  const historicas = citas.filter((c) => c.estado !== 'pendiente');

  const slotsManana = slots.filter((s) => Number(s.hora.split(':')[0]) < 13);
  const slotsTarde = slots.filter((s) => Number(s.hora.split(':')[0]) >= 13);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-bold text-teal-700">Cargando tu calendario de citas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Mis Citas 📅
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Reserva consultas en segundos, confirma asistencia o revisa tus visitas anteriores.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          disabled={mascotas.length === 0}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md shadow-teal-900/15 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
        >
          <Plus size={16} weight="bold" />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      {/* Citas Próximas */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
          Próximas Visitas ({pendientes.length})
        </h2>

        {pendientes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-amber-200 rounded-3xl p-10 text-center space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-3xl flex items-center justify-center mx-auto">
              🗓️
            </div>
            <p className="text-base font-extrabold text-slate-800">
              No tienes citas pendientes por ahora
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ¿Toca vacuna, control o baño medicado? Reserva un horario disponible en pocos clics.
            </p>
            <button
              type="button"
              onClick={openModal}
              disabled={mascotas.length === 0}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-extrabold shadow-xs transition-all disabled:opacity-50"
            >
              <CalendarHeart size={16} weight="fill" />
              <span>Reservar una cita</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendientes.map((c) => {
              const confirmada = c.estado_detalle === 'Confirmada';
              const enAtencion = c.estado_detalle === 'En atención';
              const busy = actionId === c.id;
              return (
                <div
                  key={c.id}
                  className="bg-white border border-amber-100 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                        {getEspecieEmoji(c.especie)}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {c.mascota_nombre}
                        </p>
                        <p className="text-xs font-bold text-teal-700 flex items-center gap-1 mt-0.5">
                          <Clock size={13} weight="bold" />
                          <span>{formatDateTime(c.fecha_hora)}</span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                        enAtencion
                          ? 'bg-sky-100 text-sky-800'
                          : confirmada
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.estado_detalle}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-3.5 py-2.5 text-xs space-y-1">
                    <p className="text-slate-700">
                      <strong className="text-slate-900">Motivo:</strong> {c.motivo}
                    </p>
                    <p className="text-slate-500 flex items-center gap-1.5">
                      <Stethoscope size={14} className="text-teal-600" />
                      <span>Dr(a). {c.veterinario_nombre}</span>
                    </p>
                  </div>

                  {!enAtencion && (
                    <div className="flex items-center gap-2 pt-1">
                      {!confirmada && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleConfirmar(c.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle size={15} weight="bold" />
                          <span>¡Ahí estaremos!</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleCancelar(c)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-2xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <XCircle size={15} />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de Citas */}
      {historicas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Visitas Anteriores ({historicas.length})
          </h2>
          <div className="bg-white border border-slate-200/80 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-xs">
            {historicas.slice(0, 20).map((c) => (
              <div
                key={c.id}
                className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2 text-xs hover:bg-amber-50/30 transition-colors"
              >
                <div>
                  <p className="font-extrabold text-slate-800">
                    {getEspecieEmoji(c.especie)} {c.mascota_nombre} —{' '}
                    <span className="font-semibold text-slate-600">{c.motivo}</span>
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {formatDateTime(c.fecha_hora)} • Dr(a). {c.veterinario_nombre}
                  </p>
                  {c.estado === 'cancelada' && c.observaciones && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      Motivo: {c.observaciones}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                    c.estado === 'atendida'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {c.estado_detalle}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL AGENDAR CITA (CENTRADO CON MARGEN SEGURO EN MÓVIL) ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-xl bg-white border border-amber-100 rounded-3xl shadow-2xl overflow-hidden max-h-[86vh] flex flex-col">
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-teal-50 to-amber-50 border-b border-amber-100 flex items-center justify-between flex-shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="font-extrabold text-base text-slate-900 truncate">
                  Reservar una Cita 🐾
                </h3>
                <p className="text-xs text-slate-500">Elige tu peludito, doctor y horario ideal</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-xl hover:bg-white/80 flex items-center justify-center text-slate-500 flex-shrink-0"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleAgendar} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                {formError && (
                  <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    <WarningCircle size={16} weight="bold" className="flex-shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Selector visual de mascota */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    ¿Para quién es la cita? *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {mascotas.map((m) => {
                      const active = String(m.id) === String(mascotaId);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMascotaId(String(m.id))}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 text-xs font-extrabold transition-all active:scale-95 ${
                            active
                              ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'
                          }`}
                        >
                          <span className="text-base">{getEspecieEmoji(m.especie)}</span>
                          <span>{m.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Veterinario y Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Veterinario *
                    </label>
                    <select
                      value={veterinarioId}
                      onChange={(e) => setVeterinarioId(e.target.value)}
                      className="w-full h-11 px-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-teal-500"
                    >
                      {veterinarios.map((v) => (
                        <option key={v.id} value={v.id}>
                          Dr(a). {v.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Horarios agrupados Mañana / Tarde */}
                <div className="space-y-3">
                  <label className="block text-xs font-extrabold text-slate-700">
                    Elige un horario libre *
                  </label>
                  {loadingSlots ? (
                    <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold py-3">
                      <Spinner size="sm" />
                      <span>Buscando horarios disponibles...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mb-1.5">
                          <SunHorizon size={14} weight="duotone" /> Mañana
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {slotsManana.map((s) => (
                            <button
                              key={s.hora}
                              type="button"
                              disabled={!s.disponible}
                              onClick={() => setHora(s.hora)}
                              className={`h-9 rounded-xl text-xs font-extrabold border transition-all ${
                                hora === s.hora
                                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm scale-[1.03]'
                                  : s.disponible
                                  ? 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
                                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                              }`}
                            >
                              {s.hora}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-orange-600 flex items-center gap-1 mb-1.5">
                          <Sun size={14} weight="duotone" /> Tarde
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {slotsTarde.map((s) => (
                            <button
                              key={s.hora}
                              type="button"
                              disabled={!s.disponible}
                              onClick={() => setHora(s.hora)}
                              className={`h-9 rounded-xl text-xs font-extrabold border transition-all ${
                                hora === s.hora
                                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm scale-[1.03]'
                                  : s.disponible
                                  ? 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
                                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                              }`}
                            >
                              {s.hora}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Motivo rápido con chips + input */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700">
                    ¿En qué podemos ayudarle? *
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOTIVOS_RAPIDOS.map((chip) => {
                      const selected = motivo === chip.text;
                      return (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => setMotivo(chip.text)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
                            selected
                              ? 'bg-amber-400 border-amber-500 text-slate-900'
                              : 'bg-amber-50/70 border-amber-200/80 text-slate-700 hover:bg-amber-100'
                          }`}
                        >
                          {chip.emoji} {chip.label}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="O escribe el motivo con tus palabras..."
                    className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 sm:flex items-center justify-end gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 h-11 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-4 sm:px-6 h-11 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md shadow-teal-900/15 disabled:opacity-50"
                >
                  {saving ? 'Reservando...' : 'Confirmar Reserva 🐾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
