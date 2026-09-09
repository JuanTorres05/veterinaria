import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import api from '../services/api';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Envelope, 
  Stethoscope, 
  Calendar, 
  Notebook, 
  Check, 
  WarningCircle,
  Clock,
  FirstAid,
  Prescription
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

// Función helper para evitar la duplicación de prefijos "Dr(a). Dra. Natalia Paredes"
function formatVetNombre(nombre) {
  if (!nombre) return 'Veterinario';
  const clean = nombre.trim();
  if (clean.toLowerCase().startsWith('dr.') || clean.toLowerCase().startsWith('dra.') || clean.toLowerCase().startsWith('dr ') || clean.toLowerCase().startsWith('dra ')) {
    return clean;
  }
  return `Dr(a). ${clean}`;
}

export default function FichaMascotaPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isVeterinarioOrAdmin = user?.rol === 'veterinario' || user?.rol === 'admin';

  // State
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [motivoInput, setMotivoInput] = useState('');
  const [diagnosticoInput, setDiagnosticoInput] = useState('');
  const [tratamientoInput, setTratamientoInput] = useState('');
  const [notasInput, setNotasInput] = useState('');
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadMascotaDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/mascotas/${id}`);
      setMascota(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener la ficha del paciente.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMascotaDetails();
  }, [loadMascotaDetails]);

  const handleSubmitHistorial = async (e) => {
    e.preventDefault();
    if (!motivoInput.trim() || motivoInput.trim().length < 3) {
      return setFormError('El motivo de consulta debe tener al menos 3 caracteres.');
    }
    if (!diagnosticoInput.trim() || diagnosticoInput.trim().length < 3) {
      return setFormError('El diagnóstico médico debe tener al menos 3 caracteres.');
    }
    if (!tratamientoInput.trim() || tratamientoInput.trim().length < 3) {
      return setFormError('El tratamiento asignado debe tener al menos 3 caracteres.');
    }

    try {
      setGuardando(true);
      setFormError('');
      setSuccessMsg('');

      const tzOffset = (new Date()).getTimezoneOffset() * 60000;
      const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 19).replace('T', ' ');

      const res = await api.post(`/mascotas/${id}/historial`, {
        fecha: localISOTime,
        motivo: motivoInput.trim(),
        diagnostico: diagnosticoInput.trim(),
        tratamiento: tratamientoInput.trim(),
        notas: notasInput.trim() || null
      });

      // Agregar nueva entrada al historial
      setMascota(m => ({
        ...m,
        historial: [res.data, ...m.historial]
      }));

      // Limpiar formulario
      setMotivoInput('');
      setDiagnosticoInput('');
      setTratamientoInput('');
      setNotasInput('');
      setSuccessMsg('¡Consulta médica registrada exitosamente en la historia clínica!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al registrar la consulta clínica.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cargando expediente clínico...</p>
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-6">
      
      {/* ── Cabecera del Expediente del Paciente ── */}
      <div className="space-y-4 pb-2 border-b border-slate-200">
        <Link 
          to="/pacientes" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={15} weight="bold" />
          <span>Volver al Directorio de Pacientes</span>
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl shadow-xs select-none">
              {getEspecieEmoji(mascota.especie)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {mascota.nombre}
                </h1>
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                  {mascota.especie}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Raza: <span className="text-slate-800">{mascota.raza}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs">
            <FirstAid size={16} className="text-sky-600" />
            <span>Expediente Médico #{mascota.id}</span>
          </div>
        </div>
      </div>

      {/* ── Layout en 2 Columnas (Panel de Diagnóstico + Panel Lateral) ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ── PANEL IZQUIERDO (65%): Formulario Médico + Historias Clínicas ── */}
        <div className="w-full lg:w-[65%] space-y-6">
          
          {/* Formulario: Registrar Nueva Consulta Médica (Veterinarios y Admin) */}
          {isVeterinarioOrAdmin && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 select-none border-b border-slate-100 pb-3">
                <Stethoscope size={18} className="text-sky-600" />
                <span>Registrar Nueva Consulta Médica</span>
              </h2>

              {formError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold">
                  <WarningCircle size={16} className="text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <Check size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitHistorial} className="space-y-4">
                {/* 1. Motivo (*) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Motivo de Consulta <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Ej. Control post-quirúrgico, vacunación triple felina, malestar digestivo..."
                    value={motivoInput}
                    onChange={(e) => setMotivoInput(e.target.value)}
                    className="input-field"
                  />
                </div>

                {/* 2. Diagnóstico y Tratamiento (*) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Diagnóstico Clínico <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      placeholder="Describa los hallazgos médicos y el diagnóstico evaluado..."
                      value={diagnosticoInput}
                      onChange={(e) => setDiagnosticoInput(e.target.value)}
                      rows="3"
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-sky-600 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Tratamiento Asignado <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      placeholder="Describa el tratamiento, medicamentos, dosis e indicaciones..."
                      value={tratamientoInput}
                      onChange={(e) => setTratamientoInput(e.target.value)}
                      rows="3"
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-sky-600 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* 3. Notas adicionales */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Notas o Recomendaciones Adicionales (Opcional)
                  </label>
                  <textarea
                    placeholder="Cuidados en el hogar, dieta recomendada, fecha tentativa de control..."
                    value={notasInput}
                    onChange={(e) => setNotasInput(e.target.value)}
                    rows="2"
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-sky-600 transition-all resize-none"
                  />
                </div>

                {/* Botón Principal Unificado al Sistema Semántico (Azul = Crear/Guardar) */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="btn-action-create min-w-[200px] justify-center">
                    {guardando ? (
                      <>
                        <Spinner size="sm" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} weight="bold" />
                        <span>Guardar Consulta Médica</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Timeline: HISTORIAL DE CONSULTAS CLÍNICAS (Diferenciado de Citas) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 select-none">
                <Notebook size={18} className="text-sky-600" />
                <span>Historial de Consultas Clínicas & Diagnósticos ({mascota.historial.length})</span>
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                Fichas Médicas
              </span>
            </div>

            {mascota.historial.length === 0 ? (
              <div className="text-center p-8 text-slate-400 italic text-xs">
                No hay registros de consultas clínicas guardados en la historia médica de {mascota.nombre}.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-6">
                {mascota.historial.map((h) => (
                  <div key={h.id} className="relative group">
                    
                    {/* Indicador de Línea de Tiempo */}
                    <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-600 group-hover:scale-110 transition-transform"></span>

                    {/* Tarjeta de Consulta Clínica */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 shadow-2xs hover:border-sky-300 transition-all">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha de Atención</span>
                          <p className="font-extrabold text-xs text-slate-900">{formatDate(h.fecha)}</p>
                        </div>

                        {/* Nombre del Veterinario (Sin duplicar prefijo Dr(a). Dra.) */}
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Atendido Por</span>
                          <p className="font-bold text-xs text-sky-700">
                            {formatVetNombre(h.veterinario_nombre)}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3 space-y-2.5">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Motivo Registrado</span>
                          <p className="text-xs text-slate-800 font-semibold">{h.motivo}</p>
                        </div>
                        
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Diagnóstico Clínico</span>
                          <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                            {h.diagnostico}
                          </p>
                        </div>
                        
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5 flex items-center gap-1">
                            <Prescription size={12} className="text-emerald-600" />
                            Tratamiento & Prescripción
                          </span>
                          <p className="text-xs text-emerald-950 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 leading-relaxed font-medium">
                            {h.tratamiento}
                          </p>
                        </div>

                        {h.notas && (
                          <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-900">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">Notas Adicionales</span>
                            <p className="italic">{h.notas}</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── PANEL DERECHO (35%): Datos del Propietario + Historial de Citas de Agenda ── */}
        <div className="w-full lg:w-[35%] space-y-6">
          
          {/* Tarjeta: Datos del Propietario */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 select-none border-b border-slate-100 pb-2.5">
              <User size={17} className="text-sky-600" />
              <span>Contacto del Propietario</span>
            </h2>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div>
                <p className="font-extrabold text-sm text-slate-900">{mascota.cliente.nombre}</p>
                <span className="text-[10px] text-sky-700 font-extrabold uppercase tracking-wider">Titular Principal</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-3">
                <p className="flex items-center gap-2 font-semibold">
                  <Phone size={14} className="text-sky-600 flex-shrink-0" />
                  <span>{mascota.cliente.telefono}</span>
                </p>
                <p className="flex items-center gap-2 font-semibold">
                  <Envelope size={14} className="text-sky-600 flex-shrink-0" />
                  <span className="truncate max-w-[190px]" title={mascota.cliente.correo}>
                    {mascota.cliente.correo}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta: HISTORIAL DE CITAS DE AGENDA (Diferenciado de Historias Clínicas) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 select-none">
                <Calendar size={17} className="text-sky-600" />
                <span>Historial de Citas ({mascota.citas.length})</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Programación
              </span>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Registro de agendamiento y asistencia en recepción:
            </p>

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
                    <div key={c.id} className="pt-2 flex flex-col gap-1">
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
