import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { resolveArchivoUrl } from '../utils/archivos';
import {
  FirstAidKit,
  Plus,
  CheckCircle,
  PencilSimple,
  Stethoscope,
  Clock,
  ArrowRight,
  WarningCircle,
  X,
  User,
} from '@phosphor-icons/react';

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatEstancia(horas) {
  const h = Number(horas || 0);
  if (h < 24) return `${h} h`;
  const dias = Math.floor(h / 24);
  const resto = h % 24;
  return resto > 0 ? `${dias} d ${resto} h` : `${dias} d`;
}

export default function HospitalizacionPage() {
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const canManage = user?.rol === 'admin' || user?.rol === 'veterinario';

  const [registros, setRegistros] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('Activa');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal Nuevo Ingreso
  const [modalNuevo, setModalNuevo] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [vets, setVets] = useState([]);
  const [mascotaId, setMascotaId] = useState('');
  const [vetId, setVetId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tratamientos, setTratamientos] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal Actualizar Evolución / Alta
  const [editItem, setEditItem] = useState(null);
  const [editTrat, setEditTrat] = useState('');
  const [editObs, setEditObs] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const { data } = await api.get('/hospitalizaciones', { params });
      setRegistros(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar las hospitalizaciones.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirNuevoIngreso = async () => {
    setModalNuevo(true);
    setFormError('');
    setMotivo('');
    setTratamientos('');
    setObservaciones('');
    setMascotaId('');
    setVetId('');
    try {
      const [cRes, vRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/auth/veterinarios').catch(() => ({ data: [] })),
      ]);
      setClientes(cRes.data || []);
      setVets(vRes.data || []);
    } catch {
      // silencioso
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!mascotaId) return setFormError('Selecciona un paciente.');
    if (motivo.trim().length < 3) return setFormError('Indica el motivo de ingreso.');
    try {
      setSaving(true);
      setFormError('');
      await api.post('/hospitalizaciones', {
        mascota_id: Number(mascotaId),
        veterinario_id: vetId ? Number(vetId) : null,
        motivo: motivo.trim(),
        tratamientos_realizados: tratamientos.trim() || null,
        observaciones: observaciones.trim() || null,
      });
      setModalNuevo(false);
      setFiltroEstado('Activa');
      await cargar();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al registrar el ingreso.');
    } finally {
      setSaving(false);
    }
  };

  const abrirEdicion = (item) => {
    setEditItem(item);
    setEditTrat('');
    setEditObs('');
    setEditError('');
  };

  const handleActualizar = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editTrat.trim() && !editObs.trim()) {
      return setEditError('Ingresa el tratamiento aplicado o la nota de evolución para registrar el seguimiento.');
    }
    try {
      setSavingEdit(true);
      setEditError('');
      await api.patch(`/hospitalizaciones/${editItem.id}`, {
        tratamientos_realizados: editTrat.trim() || null,
        observaciones: editObs.trim() || null,
      });
      setEditItem(null);
      notify.success(`Nuevo registro de evolución guardado para ${editItem.mascota_nombre}.`);
      await cargar();
    } catch (err) {
      setEditError(err.response?.data?.message || 'No se pudo registrar la evolución.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDarDeAlta = async (item) => {
    const ok = await confirm({
      title: 'Dar de alta clínica',
      message: `¿Confirmas el alta clínica de ${item.mascota_nombre}? El resumen de la estancia y sus evoluciones se guardarán automáticamente en su Historia Clínica.`,
      confirmLabel: 'Confirmar alta',
      tone: 'primary',
    });
    if (!ok) return;
    try {
      await api.patch(`/hospitalizaciones/${item.id}`, { estado: 'Finalizada' });
      notify.success(`Alta clínica registrada y agregada a la historia clínica de ${item.mascota_nombre}.`);
      await cargar();
    } catch (err) {
      notify.error(err.response?.data?.message || 'No se pudo registrar el alta.');
    }
  };

  const todasLasMascotas = clientes.flatMap((c) =>
    (c.mascotas || []).map((m) => ({
      id: m.id,
      label: `${m.nombre} (${m.especie}) — Dueño: ${c.nombre}`,
    }))
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-sky-700 shadow-xs">
            <FirstAidKit size={22} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Hospitalización y Monitoreo Clínico
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Control de pacientes internados, evolución intrahospitalaria y altas médicas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            {[
              { val: 'Activa', label: 'Internados' },
              { val: 'Finalizada', label: 'Egresos' },
              { val: '', label: 'Todos' },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setFiltroEstado(tab.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filtroEstado === tab.val
                    ? 'bg-sky-700 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {canManage && (
            <button type="button" onClick={abrirNuevoIngreso} className="btn-action-create">
              <Plus size={16} weight="bold" />
              <span>Nuevo Ingreso</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <WarningCircle size={18} weight="bold" className="text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="bg-white border border-slate-200 rounded-xl p-5 h-44 animate-pulse" />
          ))}
        </div>
      ) : registros.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <FirstAidKit size={28} />
          </div>
          <h3 className="font-bold text-base text-slate-900">
            {filtroEstado === 'Activa'
              ? 'No hay pacientes hospitalizados en este momento'
              : 'Sin registros de hospitalización en este filtro'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Puedes ingresar un paciente desde el botón <strong>Nuevo Ingreso</strong> o marcando{' '}
            <strong>Requiere hospitalización</strong> al atender una cita.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {registros.map((item) => {
            const esActiva = item.estado === 'Activa';
            return (
              <article
                key={item.id}
                className={`bg-white rounded-xl border overflow-hidden transition-colors ${
                  esActiva ? 'border-sky-200 shadow-xs' : 'border-slate-200 opacity-90'
                }`}
              >
                {/* Cabecera */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {item.mascota_foto_url && (
                      <img
                        src={resolveArchivoUrl(item.mascota_foto_url)}
                        alt={item.mascota_nombre}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/mascotas/${item.mascota_id}`}
                          className="font-bold text-sm text-slate-900 hover:text-sky-700 inline-flex items-center gap-1"
                        >
                          <span>{item.mascota_nombre}</span>
                          <ArrowRight size={13} weight="bold" className="text-slate-400" />
                        </Link>
                        <span className="text-xs text-slate-500">
                          ({item.especie}{item.raza ? ` • ${item.raza}` : ''})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <User size={12} />
                        <span>{item.cliente_nombre}</span>
                        {item.cliente_telefono && <span>• {item.cliente_telefono}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        esActiva
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {esActiva && <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />}
                      {esActiva ? 'Internado' : item.estado}
                    </span>
                  </div>
                </div>

                {/* Cuerpo clínico */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Clock size={13} className="text-slate-400" />
                      Ingreso: <strong className="text-slate-700">{formatDateTime(item.fecha_ingreso)}</strong>
                      <span className="text-slate-400">({formatEstancia(item.horas_estancia)})</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <Stethoscope size={13} className="text-sky-700" />
                      Dr(a). {item.veterinario_nombre}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Motivo de internación
                    </span>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{item.motivo}</p>
                  </div>

                  {item.tratamientos_realizados && (
                    <div className="border-l-2 border-emerald-600 pl-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                        Tratamientos aplicados
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {item.tratamientos_realizados}
                      </p>
                    </div>
                  )}

                  {item.observaciones && (
                    <div className="border-l-2 border-amber-400 pl-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Observaciones iniciales
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {item.observaciones}
                      </p>
                    </div>
                  )}

                  {item.evoluciones && item.evoluciones.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                        Seguimiento y evoluciones registradas ({item.evoluciones.length})
                      </span>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {item.evoluciones.map((ev) => (
                          <div
                            key={ev.id}
                            className="border-l-2 border-sky-500 pl-3 py-0.5 text-xs space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                              <span className="font-bold text-slate-700">{formatDateTime(ev.fecha)}</span>
                              <span>Dr(a). {ev.veterinario_nombre}</span>
                            </div>
                            {ev.tratamientos && (
                              <p className="text-slate-800 font-medium">{ev.tratamientos}</p>
                            )}
                            {ev.observaciones && (
                              <p className="text-slate-600">{ev.observaciones}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!esActiva && item.fecha_egreso && (
                    <p className="text-[11px] text-emerald-700 font-semibold pt-2 border-t border-slate-100">
                      Egreso registrado: {formatDateTime(item.fecha_egreso)}
                    </p>
                  )}

                  {esActiva && canManage && (
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <PencilSimple size={14} weight="bold" />
                        <span>Actualizar Evolución</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDarDeAlta(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                      >
                        <CheckCircle size={14} weight="bold" />
                        <span>Dar de Alta</span>
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Ingreso */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">Nuevo Ingreso a Hospitalización</h2>
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleCrear} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Paciente *
                </label>
                <select
                  required
                  value={mascotaId}
                  onChange={(e) => setMascotaId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-sky-600"
                >
                  <option value="">Selecciona una mascota...</option>
                  {todasLasMascotas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {user?.rol === 'admin' && vets.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Veterinario Responsable *
                  </label>
                  <select
                    required
                    value={vetId}
                    onChange={(e) => setVetId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-sky-600"
                  >
                    <option value="">Selecciona veterinario...</option>
                    {vets.map((v) => (
                      <option key={v.id} value={v.id}>
                        Dr(a). {v.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Motivo de internación *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. Observación post-quirúrgica / Deshidratación severa"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Tratamientos iniciales
                </label>
                <textarea
                  rows="2"
                  value={tratamientos}
                  onChange={(e) => setTratamientos(e.target.value)}
                  placeholder="Fluidoterapia, analgesia, monitoreo..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-600 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Observaciones
                </label>
                <textarea
                  rows="2"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Signos vitales al ingreso, indicaciones de turno..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {saving ? 'Ingresando...' : 'Registrar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Actualizar Evolución */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Evolución de {editItem.mascota_nombre}
                </h2>
                <p className="text-xs text-slate-500">{editItem.motivo}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

                    <form onSubmit={handleActualizar} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold">
                  {editError}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Nuevo tratamiento o medicación aplicada en este turno
                </label>
                <textarea
                  rows="3"
                  value={editTrat}
                  onChange={(e) => setEditTrat(e.target.value)}
                  placeholder="Ej. Se administra analgesia y se continúa fluidoterapia IV..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-600 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Nueva nota de evolución clínica
                </label>
                <textarea
                  rows="3"
                  value={editObs}
                  onChange={(e) => setEditObs(e.target.value)}
                  placeholder="Ej. Paciente alerta, mucosas rosadas, tolera alimento blando..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {savingEdit ? 'Guardando...' : 'Registrar Evolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
