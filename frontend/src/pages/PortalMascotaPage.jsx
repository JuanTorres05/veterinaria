import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useFeedback } from '../context/FeedbackContext';
import Spinner from '../components/Spinner';
import { resolveArchivoUrl, leerArchivosParaSubida } from '../utils/archivos';
import { descargarHistoriaClinicaPDF } from '../utils/historiaClinicaPrint';
import {
  ArrowLeft,
  ClipboardText,
  Prescription,
  Paperclip,
  Heartbeat,
  DownloadSimple,
  Camera,
  Scales,
  GenderIntersex,
  CalendarBlank,
  IdentificationBadge,
  Stethoscope,
  FilePdf,
  ArrowSquareOut,
  WarningCircle,
  PawPrint,
  CalendarHeart,
} from '@phosphor-icons/react';

function getEspecieEmoji(especie) {
  const e = (especie || '').toLowerCase();
  if (e.includes('perro')) return '🐕';
  if (e.includes('gato')) return '🐈';
  if (e.includes('ave')) return '🦜';
  if (e.includes('conejo')) return '🐇';
  if (e.includes('reptil')) return '🦎';
  return '🐾';
}

function getBannerGradient(especie) {
  const e = (especie || '').toLowerCase();
  if (e.includes('perro')) return 'from-amber-100 via-orange-50 to-rose-50';
  if (e.includes('gato')) return 'from-teal-100 via-emerald-50 to-cyan-50';
  if (e.includes('conejo')) return 'from-violet-100 via-purple-50 to-pink-50';
  return 'from-sky-100 via-teal-50 to-emerald-50';
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatShortDate(str) {
  if (!str) return 'No registrada';
  return new Date(str).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PortalMascotaPage() {
  const { id } = useParams();
  const { notify } = useFeedback();

  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('historial');
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const fotoInputRef = useRef(null);

  const loadMascota = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/portal/mascotas/${id}`);
      setMascota(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el carnet de tu mascota.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMascota();
  }, [loadMascota]);

  async function handleChangeFoto(e) {
    try {
      const files = e.target.files;
      if (!files?.length) return;
      const [arch] = await leerArchivosParaSubida(files);
      if (!arch?.esImagen) {
        return notify.error('Selecciona una imagen válida (JPG, PNG o WEBP).');
      }
      setSubiendoFoto(true);
      await api.patch(`/portal/mascotas/${id}/foto`, {
        nombre_archivo: arch.nombre_archivo,
        mime_type: arch.mime_type,
        base64_data: arch.base64_data,
      });
      notify.success('¡Qué linda foto! Perfil actualizado 🐾');
      loadMascota();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'No se pudo actualizar la foto.');
    } finally {
      setSubiendoFoto(false);
      e.target.value = '';
    }
  }

  function handleDownloadPdf() {
    if (!mascota) return;
    try {
      descargarHistoriaClinicaPDF(mascota);
      notify.success('Descargando carnet e historia clínica en PDF...');
    } catch {
      notify.error('No se pudo generar el PDF.');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-bold text-teal-700">Abriendo el carnet digital...</p>
      </div>
    );
  }

  if (error || !mascota) {
    return (
      <div className="bg-white border border-rose-200 rounded-3xl p-8 text-center space-y-3">
        <WarningCircle size={32} className="text-rose-500 mx-auto" />
        <p className="text-sm font-bold text-slate-800">{error || 'Mascota no encontrada.'}</p>
        <Link
          to="/portal"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-teal-600 text-white text-xs font-extrabold"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Volver a Mis Peluditos</span>
        </Link>
      </div>
    );
  }

  const historial = mascota.historial || [];
  const hospitalizaciones = mascota.hospitalizaciones || [];
  const procedimientos = mascota.procedimientos || [];

  const recetas = historial.flatMap((c) =>
    (c.recetas || []).map((r) => ({
      ...r,
      consultaFecha: c.fecha,
      consultaMotivo: c.motivo,
      veterinario: c.veterinario_nombre,
    }))
  );

  const archivos = [
    ...historial.flatMap((c) =>
      (c.archivos || []).map((a) => ({ ...a, origen: `Visita del ${formatShortDate(c.fecha)}` }))
    ),
    ...procedimientos.flatMap((p) =>
      (p.archivos || []).map((a) => ({ ...a, origen: p.tipo_procedimiento || 'Procedimiento' }))
    ),
  ];

  const fotoUrl = mascota.fotoUrl ? resolveArchivoUrl(mascota.fotoUrl) : null;

  return (
    <div className="space-y-6">
      {/* Navegación superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/portal"
          className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-amber-200/80 text-xs font-extrabold text-slate-700 hover:border-teal-300 hover:text-teal-700 shadow-2xs transition-all w-fit"
        >
          <ArrowLeft size={15} weight="bold" />
          <span>Mis Peluditos</span>
        </Link>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <Link
            to="/portal/citas?agendar=1"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 h-10 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-extrabold shadow-xs transition-all"
          >
            <CalendarHeart size={16} weight="fill" />
            <span>Agendar cita</span>
          </Link>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 h-10 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-xs transition-all"
          >
            <DownloadSimple size={16} weight="bold" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* ── CARNET DIGITAL DE SALUD ── */}
      <div className="bg-white border border-amber-100 rounded-[2rem] overflow-hidden shadow-md shadow-amber-900/5">
        <div className={`relative bg-gradient-to-br ${getBannerGradient(mascota.especie)} p-6 sm:p-7`}>
          <PawPrint
            size={120}
            weight="fill"
            className="absolute right-4 -bottom-4 text-slate-900/[0.04] rotate-[-12deg] pointer-events-none"
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar con botón de cámara */}
            <div className="relative w-24 h-24 flex-shrink-0">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={mascota.nombre}
                  className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-white ring-4 ring-white/80 flex items-center justify-center text-5xl shadow-md">
                  {getEspecieEmoji(mascota.especie)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                disabled={subiendoFoto}
                title="Cambiar foto de perfil"
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-lg border-2 border-white transition-all active:scale-95"
              >
                <Camera size={16} weight="bold" />
              </button>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChangeFoto}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/80 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                Carnet Digital de Salud
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {mascota.nombre}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-white/90 border border-slate-200/80 text-slate-700 text-xs font-extrabold">
                  {mascota.especie}
                </span>
                {mascota.raza && (
                  <span className="text-sm font-bold text-slate-600">• {mascota.raza}</span>
                )}
              </div>
              {mascota.observaciones && (
                <p className="text-xs text-slate-700 bg-white/75 rounded-xl px-3 py-1.5 mt-2.5 inline-block font-medium">
                  💛 {mascota.observaciones}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Datos Biométricos en tarjetas limpias */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-white">
          <div className="rounded-2xl bg-amber-50/70 border border-amber-100 px-3.5 py-2.5">
            <span className="text-[10px] font-extrabold uppercase text-amber-700 flex items-center gap-1">
              <Scales size={12} /> Peso actual
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {mascota.pesoKg ? `${mascota.pesoKg} kg` : 'Sin registro'}
            </p>
          </div>
          <div className="rounded-2xl bg-teal-50/70 border border-teal-100 px-3.5 py-2.5">
            <span className="text-[10px] font-extrabold uppercase text-teal-700 flex items-center gap-1">
              <GenderIntersex size={12} /> Sexo
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {mascota.sexo || 'Desconocido'}
            </p>
          </div>
          <div className="rounded-2xl bg-sky-50/70 border border-sky-100 px-3.5 py-2.5">
            <span className="text-[10px] font-extrabold uppercase text-sky-700 flex items-center gap-1">
              <CalendarBlank size={12} /> Cumpleaños
            </span>
            <p className="text-xs font-extrabold text-slate-900 mt-1 truncate">
              {formatShortDate(mascota.fechaNacimiento)}
            </p>
          </div>
          <div className="rounded-2xl bg-violet-50/70 border border-violet-100 px-3.5 py-2.5">
            <span className="text-[10px] font-extrabold uppercase text-violet-700 flex items-center gap-1">
              <IdentificationBadge size={12} /> Color / Pelaje
            </span>
            <p className="text-xs font-extrabold text-slate-900 mt-1 truncate">
              {mascota.color || 'No registrado'}
            </p>
          </div>
        </div>
      </div>

      {/* ── PESTAÑAS DEL CARNET ── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-amber-50/40 px-3 pt-3 overflow-x-auto">
          {[
            { id: 'historial', label: 'Visitas al Vet', count: historial.length, icon: ClipboardText },
            { id: 'recetas', label: 'Recetas', count: recetas.length, icon: Prescription },
            { id: 'archivos', label: 'Exámenes y Fotos', count: archivos.length, icon: Paperclip },
            { id: 'hospitalizaciones', label: 'Hospitalización', count: hospitalizaciones.length, icon: Heartbeat },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold whitespace-nowrap border-b-2 rounded-t-2xl transition-all ${
                  active
                    ? 'border-teal-600 text-teal-800 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                <Icon size={15} weight={active ? 'fill' : 'duotone'} />
                <span>{t.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    active ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-5 sm:p-6">
          {/* TAB 1: VISITAS */}
          {tab === 'historial' && (
            historial.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-3xl">🩺</p>
                <p className="text-sm font-extrabold text-slate-800">
                  Aún no hay visitas registradas para {mascota.nombre}
                </p>
                <p className="text-xs text-slate-500">
                  Cuando asista a su primera consulta, aquí aparecerá todo su seguimiento.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historial.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-extrabold text-slate-900">{c.motivo}</p>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                        {formatDate(c.fecha)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white rounded-2xl border border-slate-200/70 p-3.5">
                        <span className="text-[10px] font-extrabold uppercase text-teal-600">
                          Diagnóstico
                        </span>
                        <p className="text-slate-800 font-medium mt-1 leading-relaxed">
                          {c.diagnostico}
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-200/70 p-3.5">
                        <span className="text-[10px] font-extrabold uppercase text-amber-600">
                          Tratamiento y Cuidados
                        </span>
                        <p className="text-slate-800 mt-1 leading-relaxed">{c.tratamiento}</p>
                      </div>
                    </div>
                    {c.notas && (
                      <p className="text-xs text-teal-900 bg-teal-50/70 border border-teal-100 rounded-2xl px-3.5 py-2.5">
                        <strong>💡 Recomendaciones para casa:</strong> {c.notas}
                      </p>
                    )}
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                      <Stethoscope size={14} className="text-teal-600" />
                      <span>Atendido por Dr(a). {c.veterinario_nombre}</span>
                    </p>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 2: RECETAS */}
          {tab === 'recetas' && (
            recetas.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-3xl">💊</p>
                <p className="text-sm font-extrabold text-slate-800">Sin recetas médicas todavía</p>
                <p className="text-xs text-slate-500">
                  Las fórmulas recetadas por el veterinario aparecerán organizadas aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recetas.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                          Receta #{r.id} • {r.estado}
                        </span>
                        <p className="text-xs text-slate-600 mt-1">
                          Emitida el {formatDate(r.fecha_emision)} por Dr(a). {r.veterinario}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(r.medicamentos || []).map((m) => (
                        <div
                          key={m.id}
                          className="bg-white rounded-2xl border border-emerald-200/70 p-3.5 text-xs space-y-1 shadow-2xs"
                        >
                          <p className="font-extrabold text-slate-900">
                            💊 {m.nombre} {m.presentacion ? `(${m.presentacion})` : ''}
                          </p>
                          <p className="text-slate-700">
                            <strong>Dosis:</strong> {m.dosis}
                            {m.frecuencia ? ` • ${m.frecuencia}` : ''}
                            {m.duracion ? ` • ${m.duracion}` : ''}
                          </p>
                          {m.instrucciones && <p className="text-slate-500">{m.instrucciones}</p>}
                        </div>
                      ))}
                    </div>
                    {r.indicaciones_generales && (
                      <p className="text-xs text-emerald-900 font-medium bg-white/80 rounded-xl px-3 py-2">
                        <strong>Indicaciones:</strong> {r.indicaciones_generales}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 3: ARCHIVOS */}
          {tab === 'archivos' && (
            archivos.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-3xl">🩻</p>
                <p className="text-sm font-extrabold text-slate-800">Sin exámenes ni fotos adjuntas</p>
                <p className="text-xs text-slate-500">
                  Radiografías, resultados de laboratorio y ecografías aparecerán aquí para verlos o descargarlos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {archivos.map((a) => {
                  const url = resolveArchivoUrl(a.ruta_archivo);
                  const esPdf = a.tipo_archivo === 'pdf' || a.mime_type === 'application/pdf';
                  return (
                    <a
                      key={a.id}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-teal-300 bg-white hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {esPdf ? (
                          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                            <FilePdf size={24} weight="fill" />
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt={a.nombre_archivo}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 truncate">
                            {a.nombre_archivo}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{a.origen}</p>
                        </div>
                      </div>
                      <ArrowSquareOut size={16} className="text-teal-600 flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            )
          )}

          {/* TAB 4: HOSPITALIZACIONES */}
          {tab === 'hospitalizaciones' && (
            hospitalizaciones.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-3xl">💚</p>
                <p className="text-sm font-extrabold text-slate-800">
                  ¡Qué buena noticia! Sin hospitalizaciones
                </p>
                <p className="text-xs text-slate-500">
                  {mascota.nombre} no tiene registros de internación en la clínica.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {hospitalizaciones.map((h) => (
                  <div
                    key={h.id}
                    className={`rounded-2xl border p-4 space-y-2 ${
                      h.estado === 'Activa'
                        ? 'border-amber-300 bg-amber-50/70'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-extrabold text-slate-900">{h.motivo}</p>
                      <span
                        className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold ${
                          h.estado === 'Activa'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {h.estado === 'Activa' ? '💛 En observación' : '✅ Finalizada'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Ingreso: <strong>{formatDate(h.fecha_ingreso)}</strong>
                      {h.fecha_egreso ? ` • Egreso: ${formatDate(h.fecha_egreso)}` : ' • En curso'}
                    </p>
                    {h.tratamientos_realizados && (
                      <p className="text-xs text-slate-700">
                        <strong>Cuidados recibidos:</strong> {h.tratamientos_realizados}
                      </p>
                    )}
                    {h.observaciones && <p className="text-xs text-slate-600">{h.observaciones}</p>}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
