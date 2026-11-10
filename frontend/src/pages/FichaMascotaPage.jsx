import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import api from '../services/api';
import { resolveArchivoUrl, formatBytes, leerArchivosParaSubida } from '../utils/archivos';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Envelope, 
  Stethoscope, 
  Calendar, 
  Notebook, 
  WarningCircle,
  Clock,
  FirstAid,
  Prescription,
  Scales,
  GenderIntersex,
  IdentificationBadge,
  MapPin,
  CalendarBlank,
  CheckCircle,
  UploadSimple,
  FilePdf,
  Image as ImageIcon,
  Trash,
  Plus,
  X,
  ArrowSquareOut,
  Syringe,
  Paperclip,
  Eye
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return 'No registrada';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatVetNombre(nombre) {
  if (!nombre) return 'Veterinario';
  const clean = nombre.trim();
  if (
    clean.toLowerCase().startsWith('dr.') ||
    clean.toLowerCase().startsWith('dra.') ||
    clean.toLowerCase().startsWith('dr ') ||
    clean.toLowerCase().startsWith('dra ')
  ) {
    return clean;
  }
  return `Dr(a). ${clean}`;
}

const TIPOS_PROCEDIMIENTO_SUGERIDOS = [
  'Radiografía / Rayos X',
  'Ecografía Abdominal',
  'Exámenes de Laboratorio / Hemograma',
  'Cirugía General / Esterilización',
  'Profilaxis Dental',
  'Curación y Manejo de Heridas',
  'Fluidoterapia / Canalización',
  'Aplicación de Vacuna / Desparasitación'
];

/* ── Componente Galería de Archivos Adjuntos (Fotos y PDFs) ──────────────── */
function GaleriaArchivos({ archivos = [], canEdit, onDeleteArchivo, onPreviewArchivo }) {
  if (!archivos || archivos.length === 0) return null;

  return (
    <div className="pt-2 space-y-2">
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        <Paperclip size={13} weight="bold" className="text-sky-600" />
        <span>Archivos y Soportes Adjuntos ({archivos.length})</span>
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {archivos.map((arch) => {
          const url = resolveArchivoUrl(arch.ruta_archivo);
          const esPdf = arch.tipo_archivo === 'pdf' || (arch.mime_type || '').includes('pdf');

          return (
            <div
              key={arch.id}
              className="group flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-sky-300 shadow-2xs transition-all">
              {/* Miniatura o Ícono PDF */}
              {esPdf ? (
                <button
                  type="button"
                  onClick={() => onPreviewArchivo({ ...arch, url, esPdf: true })}
                  className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex flex-col items-center justify-center flex-shrink-0 hover:bg-rose-100 transition-colors"
                  title="Abrir documento PDF">
                  <FilePdf size={22} weight="fill" />
                  <span className="text-[8px] font-extrabold uppercase">PDF</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onPreviewArchivo({ ...arch, url, esPdf: false })}
                  className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 relative group/img"
                  title="Ver imagen ampliada">
                  <img
                    src={url}
                    alt={arch.nombre_archivo}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                  />
                </button>
              )}

              {/* Nombre y Metadatos */}
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onPreviewArchivo({ ...arch, url, esPdf })}
                  className="text-xs font-bold text-slate-900 hover:text-sky-600 truncate block w-full text-left"
                  title={arch.nombre_archivo}>
                  {arch.nombre_archivo}
                </button>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span className="uppercase font-bold text-slate-500">{esPdf ? 'PDF' : 'Imagen'}</span>
                  {arch.tamano_bytes ? <span>• {formatBytes(arch.tamano_bytes)}</span> : null}
                </p>
              </div>

              {/* Botones Ver / Abrir / Eliminar */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onPreviewArchivo({ ...arch, url, esPdf })}
                  title="Vista previa"
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 flex items-center justify-center transition-colors">
                  <Eye size={14} weight="bold" />
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir en nueva pestaña"
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 flex items-center justify-center transition-colors">
                  <ArrowSquareOut size={14} weight="bold" />
                </a>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onDeleteArchivo(arch.id, arch.nombre_archivo)}
                    title="Eliminar archivo"
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors">
                    <Trash size={13} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FichaMascotaPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = user?.rol === 'veterinario' || user?.rol === 'admin';

  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [uploadingTarget, setUploadingTarget] = useState(null);

  // Visor Lightbox para Fotos y PDFs
  const [previewArchivo, setPreviewArchivo] = useState(null);

  // Modal "Registrar Nuevo Procedimiento Clínico"
  const [modalProcOpen, setModalProcOpen] = useState(false);
  const [tipoProcInput, setTipoProcInput] = useState('');
  const [consultaProcId, setConsultaProcId] = useState('');
  const [descProcInput, setDescProcInput] = useState('');
  const [obsProcInput, setObsProcInput] = useState('');
  const [archivosProcInput, setArchivosProcInput] = useState([]);
  const [procError, setProcError] = useState('');
  const [guardandoProc, setGuardandoProc] = useState(false);

  const procFileInputRef = useRef(null);

  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 5000);
  };

  const loadMascotaDetails = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setError('');
      const res = await api.get(`/mascotas/${id}`);
      setMascota(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener la ficha del paciente.');
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMascotaDetails();
  }, [loadMascotaDetails]);

  /* ── Subir Fotos / PDFs directamente a una Consulta del Historial ── */
  const handleSubirAConsulta = async (consultaId, fileList) => {
    if (!fileList || fileList.length === 0) return;
    try {
      setUploadingTarget(`consulta-${consultaId}`);
      const archivos = await leerArchivosParaSubida(fileList);
      await api.post(`/mascotas/${id}/consultas/${consultaId}/archivos`, { archivos });
      await loadMascotaDetails(true);
      showToast(`Se adjuntaron ${archivos.length} archivo(s) a la consulta #${consultaId}.`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error al subir archivos a la consulta.');
    } finally {
      setUploadingTarget(null);
    }
  };

  /* ── Subir Fotos / PDFs directamente a un Procedimiento Existente ── */
  const handleSubirAProcedimiento = async (procedimientoId, fileList) => {
    if (!fileList || fileList.length === 0) return;
    try {
      setUploadingTarget(`proc-${procedimientoId}`);
      const archivos = await leerArchivosParaSubida(fileList);
      await api.post(`/mascotas/${id}/procedimientos/${procedimientoId}/archivos`, { archivos });
      await loadMascotaDetails(true);
      showToast(`Se adjuntaron ${archivos.length} archivo(s) al procedimiento #${procedimientoId}.`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error al subir archivos al procedimiento.');
    } finally {
      setUploadingTarget(null);
    }
  };

  /* ── Eliminar Archivo Adjunto ── */
  const handleDeleteArchivo = async (archivoId, nombreArchivo) => {
    if (!window.confirm(`¿Deseas eliminar el archivo adjunto "${nombreArchivo}"?`)) return;
    try {
      await api.delete(`/mascotas/${id}/archivos/${archivoId}`);
      await loadMascotaDetails(true);
      showToast(`Archivo "${nombreArchivo}" eliminado.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar el archivo.');
    }
  };

  /* ── Seleccionar Archivos en el Modal de Nuevo Procedimiento ── */
  const handleSelectArchivosModalProc = async (e) => {
    try {
      const nuevos = await leerArchivosParaSubida(e.target.files);
      setArchivosProcInput((prev) => [...prev, ...nuevos].slice(0, 10));
      setProcError('');
    } catch (err) {
      setProcError(err.message);
    } finally {
      e.target.value = '';
    }
  };

  /* ── Guardar Nuevo Procedimiento Clínico ── */
  const handleCrearProcedimiento = async (e) => {
    e.preventDefault();
    if (!tipoProcInput.trim() || tipoProcInput.trim().length < 3) {
      return setProcError('Indica el tipo de procedimiento (mínimo 3 caracteres).');
    }
    if (!descProcInput.trim() || descProcInput.trim().length < 3) {
      return setProcError('Describe el procedimiento realizado (mínimo 3 caracteres).');
    }

    try {
      setGuardandoProc(true);
      setProcError('');
      await api.post(`/mascotas/${id}/procedimientos`, {
        consulta_id: consultaProcId ? Number(consultaProcId) : null,
        tipo_procedimiento: tipoProcInput.trim(),
        descripcion: descProcInput.trim(),
        observaciones: obsProcInput.trim() || null,
        archivos: archivosProcInput,
      });

      setModalProcOpen(false);
      setTipoProcInput('');
      setConsultaProcId('');
      setDescProcInput('');
      setObsProcInput('');
      setArchivosProcInput([]);
      await loadMascotaDetails(true);
      showToast('¡Procedimiento clínico y archivos registrados exitosamente!');
    } catch (err) {
      setProcError(err.response?.data?.message || 'Error al registrar el procedimiento.');
    } finally {
      setGuardandoProc(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cargando historia clínica...</p>
      </div>
    );
  }

  if (error || !mascota) {
    return (
      <div className="max-w-md mx-auto p-8">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm font-semibold">
          <WarningCircle size={20} className="flex-shrink-0 text-rose-600" />
          <div>
            <p className="font-bold text-sm">Error de Carga</p>
            <p className="text-xs">{error || 'No se encontró el paciente seleccionado.'}</p>
          </div>
        </div>
        <Link to="/pacientes" className="btn-action-secondary w-full mt-4 text-xs font-bold uppercase tracking-wider justify-center">
          <ArrowLeft size={14} /> <span>Volver a Pacientes</span>
        </Link>
      </div>
    );
  }

  const citasPendientes = (mascota.citas || []).filter(c => c.estado === 'pendiente');
  const procedimientos = mascota.procedimientos || [];
  const ultimaConsulta = mascota.historial?.[0] || null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-6">
      
      {/* ── Cabecera del Expediente Clínico ── */}
      <div className="space-y-4 pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link 
            to="/pacientes" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={15} weight="bold" />
            <span>Volver al Directorio de Pacientes</span>
          </Link>

          <Link
            to="/agenda"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline">
            <CalendarBlank size={15} weight="bold" />
            <span>Ir a Agenda Diaria</span>
          </Link>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl shadow-xs select-none">
              {getEspecieEmoji(mascota.especie)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {mascota.nombre}
                </h1>
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                  {mascota.especie}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle size={12} weight="fill" />
                  Historia Clínica Activa
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Raza: <span className="text-slate-800">{mascota.raza || 'No especificada'}</span>
                {mascota.sexo ? ` • Sexo: ${mascota.sexo}` : ''}
                {mascota.pesoKg ? ` • Peso actual: ${mascota.pesoKg} kg` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {canEdit && (
              <button
                type="button"
                onClick={() => setModalProcOpen(true)}
                className="btn-action-create text-xs">
                <Plus size={15} weight="bold" />
                <span>Registrar Procedimiento / Examen</span>
              </button>
            )}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs">
              <FirstAid size={16} className="text-sky-600" />
              <span>Expediente #{mascota.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Banner de confirmación ── */}
      {feedbackMsg && (
        <div className="animate-fade-in flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} weight="fill" className="text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X size={15} weight="bold" />
          </button>
        </div>
      )}

      {/* ── Tarjetas de Resumen Biométrico y Clínico del Paciente ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Scales size={20} weight="bold" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Peso Registrado</span>
            <p className="text-base font-extrabold text-slate-900">
              {mascota.pesoKg ? `${mascota.pesoKg} kg` : 'Sin registrar'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <GenderIntersex size={20} weight="bold" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sexo / Color</span>
            <p className="text-sm font-extrabold text-slate-900 truncate">
              {mascota.sexo || 'N/A'}{mascota.color ? ` • ${mascota.color}` : ''}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Stethoscope size={20} weight="bold" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Consultas / Procedimientos</span>
            <p className="text-sm font-extrabold text-slate-900">
              {mascota.historial.length} cons. • {procedimientos.length} proc.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Calendar size={20} weight="bold" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Última Atención</span>
            <p className="text-xs font-extrabold text-slate-900">
              {ultimaConsulta ? formatShortDate(ultimaConsulta.fecha) : 'Sin atenciones'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Aviso si tiene Cita Pendiente por Atender ── */}
      {citasPendientes.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50/90 text-amber-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
              <Clock size={20} weight="bold" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                Cita Pendiente por Atender ({citasPendientes.length})
              </p>
              <p className="text-xs text-amber-900 mt-0.5">
                Próxima cita: <strong>{formatDate(citasPendientes[0].fecha_hora)}</strong> — Motivo: <em>"{citasPendientes[0].motivo}"</em>
              </p>
            </div>
          </div>
          <Link
            to="/agenda"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs transition-all">
            <Stethoscope size={15} weight="bold" />
            <span>Ir a Agenda para Atender Cita</span>
          </Link>
        </div>
      )}

      {/* ── Layout en 2 Columnas: Evolución de Historia Clínica + Procedimientos (65%) | Ficha & Citas (35%) ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ── PANEL IZQUIERDO (65%): Historia Clínica + Procedimientos con Fotos y PDFs ── */}
        <div className="w-full lg:w-[65%] space-y-6">
          
          {/* 1. SECCIÓN: HISTORIA CLÍNICA Y EVOLUCIÓN MÉDICA (consultas_medicas) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 select-none">
                  <Notebook size={19} className="text-sky-600" />
                  <span>Historia Clínica y Evolución Médica ({mascota.historial.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consultas médicas originadas en la atención de citas. Puedes adjuntar fotos clínicas y reportes en PDF a cada consulta.
                </p>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                Consultas Médicas
              </span>
            </div>

            {mascota.historial.length === 0 ? (
              <div className="text-center py-10 px-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto">
                  <Stethoscope size={24} weight="bold" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">
                    Sin consultas médicas registradas para {mascota.nombre}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Las consultas se registran cuando el veterinario selecciona <strong>"Atender Cita"</strong> desde la Agenda Diaria o el Monitoreo en Vivo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative border-l-2 border-sky-200 ml-3 pl-6 space-y-6">
                {mascota.historial.map((h, index) => {
                  const isUploadingThis = uploadingTarget === `consulta-${h.id}`;
                  return (
                    <div key={h.id} className="relative group">
                      
                      {/* Indicador de Línea de Tiempo */}
                      <span className="absolute -left-[31px] top-2 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-600 group-hover:scale-110 transition-transform" />

                      {/* Tarjeta de Consulta Clínica */}
                      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3.5 shadow-2xs hover:border-sky-300 transition-all">
                        <div className="flex justify-between items-start flex-wrap gap-2 pb-2.5 border-b border-slate-200/80">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-extrabold uppercase tracking-wider">
                                Consulta #{h.id}
                              </span>
                              {h.cita_id && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Cita #{h.cita_id}
                                </span>
                              )}
                              {index === 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  Más reciente
                                </span>
                              )}
                            </div>
                            <p className="font-extrabold text-xs text-slate-900 pt-1">
                              {formatDate(h.fecha)}
                            </p>
                          </div>

                          {/* Profesional + Botón Subir Foto/PDF */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="text-right">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Médico Veterinario
                              </span>
                              <p className="font-bold text-xs text-sky-700 flex items-center justify-end gap-1 mt-0.5">
                                <Stethoscope size={14} weight="bold" />
                                <span>{formatVetNombre(h.veterinario_nombre)}</span>
                              </p>
                            </div>

                            {canEdit && (
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-extrabold transition-all shadow-2xs">
                                <UploadSimple size={14} weight="bold" />
                                <span>{isUploadingThis ? 'Subiendo...' : 'Subir Foto / PDF'}</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                  disabled={isUploadingThis}
                                  onChange={(e) => {
                                    handleSubirAConsulta(h.id, e.target.files);
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                              Síntomas / Motivo de Consulta
                            </span>
                            <p className="text-xs text-slate-900 font-semibold bg-white px-3 py-2 rounded-xl border border-slate-200">
                              {h.motivo}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Diagnóstico Médico
                              </span>
                              <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-medium h-full">
                                {h.diagnostico}
                              </p>
                            </div>
                            
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1 flex items-center gap-1">
                                <Prescription size={13} weight="bold" className="text-emerald-600" />
                                Tratamiento y Prescripción
                              </span>
                              <p className="text-xs text-emerald-950 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 leading-relaxed font-medium h-full">
                                {h.tratamiento}
                              </p>
                            </div>
                          </div>

                          {h.notas && (
                            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-950">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
                                Observaciones Clínicas / Evolución
                              </span>
                              <p className="leading-relaxed">{h.notas}</p>
                            </div>
                          )}

                          {/* Galería de Fotos y PDFs de la Consulta */}
                          <GaleriaArchivos
                            archivos={h.archivos}
                            canEdit={canEdit}
                            onDeleteArchivo={handleDeleteArchivo}
                            onPreviewArchivo={setPreviewArchivo}
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. SECCIÓN: PROCEDIMIENTOS CLÍNICOS Y SOPORTES DIAGNÓSTICOS (procedimientos + archivos_procedimiento) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 select-none">
                  <Syringe size={19} className="text-emerald-600" />
                  <span>Procedimientos Clínicos y Exámenes ({procedimientos.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cirugías, radiografías, ecografías, laboratorios y documentos PDF o fotografías de soporte (`archivos_procedimiento`).
                </p>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setModalProcOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95">
                  <Plus size={15} weight="bold" />
                  <span>Nuevo Procedimiento</span>
                </button>
              )}
            </div>

            {procedimientos.length === 0 ? (
              <div className="text-center py-10 px-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <Syringe size={24} weight="bold" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">
                    No hay procedimientos ni exámenes registrados
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Registra radiografías, ecografías, laboratorios o cirugías y adjunta sus fotografías o reportes en PDF.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {procedimientos.map((proc) => {
                  const isUploadingProc = uploadingTarget === `proc-${proc.id}`;
                  return (
                    <div
                      key={proc.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 shadow-2xs hover:border-emerald-300 transition-all">
                      <div className="flex items-start justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200/80">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                              Procedimiento #{proc.id}
                            </span>
                            {proc.consulta_id && (
                              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold">
                                Vinculado a Consulta #{proc.consulta_id}
                              </span>
                            )}
                            <span className="text-xs text-slate-500 font-semibold">
                              • {formatDate(proc.fecha)}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                            {proc.tipo_procedimiento}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Realizado por
                            </span>
                            <p className="font-bold text-xs text-emerald-700">
                              {formatVetNombre(proc.veterinario_nombre)}
                            </p>
                          </div>

                          {canEdit && (
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-extrabold transition-all shadow-2xs">
                              <UploadSimple size={14} weight="bold" />
                              <span>{isUploadingProc ? 'Subiendo...' : 'Adjuntar Foto / PDF'}</span>
                              <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                disabled={isUploadingProc}
                                onChange={(e) => {
                                  handleSubirAProcedimiento(proc.id, e.target.files);
                                  e.target.value = '';
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {proc.descripcion && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Descripción del Procedimiento / Hallazgos
                          </span>
                          <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
                            {proc.descripcion}
                          </p>
                        </div>
                      )}

                      {proc.observaciones && (
                        <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-950">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
                            Observaciones
                          </span>
                          <p>{proc.observaciones}</p>
                        </div>
                      )}

                      {/* Galería de Archivos del Procedimiento */}
                      <GaleriaArchivos
                        archivos={proc.archivos}
                        canEdit={canEdit}
                        onDeleteArchivo={handleDeleteArchivo}
                        onPreviewArchivo={setPreviewArchivo}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── PANEL DERECHO (35%): Datos del Paciente, Propietario e Historial de Citas ── */}
        <div className="w-full lg:w-[35%] space-y-6">
          
          {/* Tarjeta: Detalles del Paciente */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 select-none border-b border-slate-100 pb-2.5">
              <IdentificationBadge size={17} className="text-sky-600" />
              <span>Datos Clínicos del Paciente</span>
            </h2>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Fecha Nacimiento</span>
                <span className="font-bold text-slate-800">{formatShortDate(mascota.fechaNacimiento)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Microchip</span>
                <span className="font-bold text-slate-800">{mascota.microchip || 'No asignado'}</span>
              </div>
            </div>

            {mascota.observaciones && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                  Antecedentes / Observaciones Generales
                </span>
                <p className="text-slate-700 font-medium">{mascota.observaciones}</p>
              </div>
            )}
          </div>

          {/* Tarjeta: Datos del Propietario */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 select-none border-b border-slate-100 pb-2.5">
              <User size={17} className="text-sky-600" />
              <span>Contacto del Propietario</span>
            </h2>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div>
                <p className="font-extrabold text-sm text-slate-900">{mascota.cliente.nombre}</p>
                <span className="text-[10px] text-sky-700 font-extrabold uppercase tracking-wider">
                  {mascota.cliente.cedula ? `C.C. ${mascota.cliente.cedula}` : 'Titular Principal'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-3">
                <p className="flex items-center gap-2 font-semibold">
                  <Phone size={14} className="text-sky-600 flex-shrink-0" />
                  <span>{mascota.cliente.telefono || 'Sin teléfono'}</span>
                </p>
                {mascota.cliente.correo && (
                  <p className="flex items-center gap-2 font-semibold">
                    <Envelope size={14} className="text-sky-600 flex-shrink-0" />
                    <span className="truncate max-w-[210px]" title={mascota.cliente.correo}>
                      {mascota.cliente.correo}
                    </span>
                  </p>
                )}
                {mascota.cliente.direccion && (
                  <p className="flex items-center gap-2 font-semibold">
                    <MapPin size={14} className="text-sky-600 flex-shrink-0" />
                    <span>{mascota.cliente.direccion}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tarjeta: HISTORIAL DE CITAS DE AGENDA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 select-none">
                <Calendar size={17} className="text-sky-600" />
                <span>Historial de Citas ({mascota.citas.length})</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Agenda
              </span>
            </div>

            {mascota.citas.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl border border-slate-200">
                Esta mascota no registra citas agendadas.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 divide-y divide-slate-100">
                {mascota.citas.map((c) => {
                  const isPendiente = c.estado === 'pendiente';
                  const isAtendida  = c.estado === 'atendida';
                  return (
                    <div key={c.id} className="pt-2.5 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {formatDate(c.fecha_hora)}
                        </span>
                        {isPendiente && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">Pendiente</span>}
                        {isAtendida && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Atendida</span>}
                        {!isPendiente && !isAtendida && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">Cancelada</span>}
                      </div>
                      <p className="text-xs text-slate-600 truncate">
                        <span className="font-semibold text-slate-800">Motivo:</span> {c.motivo}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Atiende: {formatVetNombre(c.veterinario_nombre)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── MODAL "REGISTRAR PROCEDIMIENTO CLÍNICO Y SUBIR ARCHIVOS" ── */}
      {modalProcOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0F172A] text-slate-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <Syringe size={20} weight="bold" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-white tracking-tight">
                    Registrar Procedimiento Clínico / Examen
                  </h2>
                  <p className="text-xs text-slate-400">
                    Paciente: {mascota.nombre} ({mascota.especie}) • Adjunta fotos o reportes en PDF
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !guardandoProc && setModalProcOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all">
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleCrearProcedimiento} className="p-6 space-y-4 overflow-y-auto">
              {procError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs font-semibold">
                  <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-400" />
                  <span>{procError}</span>
                </div>
              )}

              {/* Tipo de procedimiento + Sugerencias rápidas */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tipo de Procedimiento o Examen <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={tipoProcInput}
                  onChange={(e) => setTipoProcInput(e.target.value)}
                  placeholder="Ej. Radiografía de tórax, Ecografía, Hemograma, Cirugía..."
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {TIPOS_PROCEDIMIENTO_SUGERIDOS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTipoProcInput(sug)}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors">
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vincular opcionalmente a una consulta existente */}
              {mascota.historial.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Vincular a Consulta Médica (Opcional)
                  </label>
                  <select
                    value={consultaProcId}
                    onChange={(e) => setConsultaProcId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-medium focus:outline-none focus:border-emerald-500">
                    <option value="">-- Procedimiento independiente / General --</option>
                    {mascota.historial.map((h) => (
                      <option key={h.id} value={h.id}>
                        Consulta #{h.id} ({formatDate(h.fecha)}) — {h.motivo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Descripción y Resultados del Procedimiento <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows="3"
                  value={descProcInput}
                  onChange={(e) => setDescProcInput(e.target.value)}
                  placeholder="Detalle el procedimiento realizado, técnica empleada o resultados del estudio..."
                  className="w-full p-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Observaciones Adicionales (Opcional)
                </label>
                <textarea
                  rows="2"
                  value={obsProcInput}
                  onChange={(e) => setObsProcInput(e.target.value)}
                  placeholder="Indicaciones post-procedimiento o notas de seguimiento..."
                  className="w-full p-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Selector de Archivos (Fotos y PDFs) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Fotos y Documentos PDF de Soporte
                </label>
                <div
                  onClick={() => procFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-xl p-4 bg-slate-900/60 text-center cursor-pointer transition-colors">
                  <div className="flex items-center justify-center gap-2 text-sky-400 font-bold text-xs">
                    <UploadSimple size={18} weight="bold" />
                    <span>Haz clic aquí para seleccionar fotografías (JPG, PNG, WEBP) o archivos PDF</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Radiografías, resultados de laboratorio en PDF, ecografías o fotos clínicas (máx. 10 MB por archivo)
                  </p>
                  <input
                    ref={procFileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                    onChange={handleSelectArchivosModalProc}
                    className="hidden"
                  />
                </div>

                {archivosProcInput.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {archivosProcInput.map((arch, idx) => (
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
                          onClick={() => setArchivosProcInput((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800">
                          <X size={14} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => !guardandoProc && setModalProcOpen(false)}
                  disabled={guardandoProc}
                  className="px-4 py-2.5 h-11 rounded-xl font-bold text-xs text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 transition-all">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProc}
                  className="inline-flex items-center gap-2 px-5 py-2.5 h-11 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 transition-all active:scale-95 disabled:opacity-50">
                  {guardandoProc ? (
                    <>
                      <Spinner size="sm" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={17} weight="bold" />
                      <span>Guardar Procedimiento y Soportes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL VISOR LIGHTBOX DE IMÁGENES Y DOCUMENTOS PDF ── */}
      {previewArchivo && (
        <div
          onClick={() => setPreviewArchivo(null)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-[#0F172A] text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center gap-2.5 min-w-0">
                {previewArchivo.esPdf ? (
                  <FilePdf size={20} weight="fill" className="text-rose-400 flex-shrink-0" />
                ) : (
                  <ImageIcon size={20} weight="fill" className="text-sky-400 flex-shrink-0" />
                )}
                <span className="font-bold text-sm truncate">{previewArchivo.nombre_archivo}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewArchivo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all">
                  <span>Abrir / Descargar</span>
                  <ArrowSquareOut size={14} weight="bold" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewArchivo(null)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center">
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 flex-1 overflow-auto flex items-center justify-center min-h-[420px]">
              {previewArchivo.esPdf ? (
                <iframe
                  src={previewArchivo.url}
                  title={previewArchivo.nombre_archivo}
                  className="w-full h-[72vh] rounded-xl border border-slate-800 bg-white"
                />
              ) : (
                <img
                  src={previewArchivo.url}
                  alt={previewArchivo.nombre_archivo}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
