import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";
import api from "../services/api";
import Spinner from "../components/Spinner";
import { 
  CalendarBlank, Plus, Trash, X, ArrowCounterClockwise, Check, 
  MagnifyingGlass, Stethoscope, Phone, User, Chat, WarningCircle, 
  CheckCircle, Clock, ClipboardText, ArrowSquareOut
} from "@phosphor-icons/react";

function getEspecieEmoji(especie) {
  const e = especie?.toLowerCase();
  if (e?.includes("perro") || e?.includes("can")) return "🐕";
  if (e?.includes("gato") || e?.includes("fel")) return "🐈";
  if (e?.includes("ave") || e?.includes("pajaro")) return "🦜";
  if (e?.includes("conejo")) return "🐇";
  if (e?.includes("reptil") || e?.includes("tortuga") || e?.includes("iguana")) return "🦎";
  return "🐾";
}

function formatTime(s) {
  if (!s) return "";
  return new Date(s).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// Formateo seguro de fecha local (sin desfasamiento por zona horaria UTC)
function formatDateDisplay(s) {
  if (!s) return "Todas las fechas";
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const ESTADO_STYLES = {
  pendiente: { bg: "bg-amber-100 text-amber-900 border-amber-300", label: "Pendiente" },
  atendida:  { bg: "bg-emerald-100 text-emerald-900 border-emerald-300", label: "Atendida" },
  cancelada: { bg: "bg-rose-100 text-rose-900 border-rose-300", label: "Cancelada" },
};

export default function AgendaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notify, confirm, promptInput } = useFeedback();
  const isAdminOrRec = user?.rol === "admin" || user?.rol === "recepcionista";
  const canAtender   = user?.rol === "veterinario" || user?.rol === "admin";

  const [citas,        setCitas]        = useState([]);
  const [clientes,     setClientes]     = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  const todayStr = (() => {
    const t = new Date(); 
    return new Date(t - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  })();

  const [fechaFiltro,  setFechaFiltro]  = useState(todayStr);
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const [modalOpen,        setModalOpen]        = useState(false);
  const [clienteQuery,     setClienteQuery]     = useState("");
  const [selectedCliente,  setSelectedCliente]  = useState(null);
  const [selectedMascotaId,setSelectedMascotaId]= useState("");
  const [selectedUsuarioId,setSelectedUsuarioId]= useState("");
  
  // Campos de fecha y hora separados para evitar placeholder "dd/mm/aaaa --:--"
  const [fechaInput,       setFechaInput]       = useState(todayStr);
  const [horaInput,        setHoraInput]        = useState("09:00");
  const [motivoInput,      setMotivoInput]      = useState("");
  const [citasDiaModal,    setCitasDiaModal]    = useState([]);
  const [loadingDisp,      setLoadingDisp]      = useState(false);
  
  const [formError,        setFormError]        = useState("");
  const [invalidFields,    setInvalidFields]    = useState({});
  const [guardando,        setGuardando]        = useState(false);
  const [successMsg,       setSuccessMsg]       = useState(null);
  const successTimer = useRef(null);
  const filtroFechaRef = useRef(null);
  const modalFechaRef  = useRef(null);
  const modalHoraRef   = useRef(null);

  function openPicker(ref) {
    if (!ref?.current) return;
    if (typeof ref.current.showPicker === "function") {
      try { ref.current.showPicker(); return; } catch { /* fallback focus */ }
    }
    ref.current.focus();
  }

  const loadCitas = useCallback(async () => {
    try {
      setLoading(true); 
      setError("");
      const params = {};
      if (fechaFiltro) params.fecha = fechaFiltro;
      const res = await api.get("/citas", { params });
      setCitas(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar las citas de la agenda.");
    } finally { 
      setLoading(false); 
    }
  }, [fechaFiltro]);

  const loadModalData = async () => {
    try {
      const resC = await api.get("/clientes");
      setClientes(resC.data);
      const resV = await api.get("/auth/veterinarios").catch(() => ({ data: [] }));
      setVeterinarios(resV.data);
    } catch (err) { 
      console.error("Error cargando datos para modal", err); 
    }
  };

  useEffect(() => { loadCitas(); }, [loadCitas]);
  useEffect(() => { if (modalOpen) loadModalData(); }, [modalOpen]);

  // Cargar citas del día seleccionado cuando el modal de agendar está abierto para mostrar disponibilidad del médico
  useEffect(() => {
    if (!modalOpen || !fechaInput) {
      setCitasDiaModal([]);
      return;
    }
    let active = true;
    setLoadingDisp(true);
    api
      .get("/citas", { params: { fecha: fechaInput } })
      .then((res) => {
        if (active) setCitasDiaModal(res.data || []);
      })
      .catch(() => {
        if (active) setCitasDiaModal([]);
      })
      .finally(() => {
        if (active) setLoadingDisp(false);
      });
    return () => {
      active = false;
    };
  }, [modalOpen, fechaInput]);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccessMsg(null), 6000);
  }

  const handleUpdateStatus = async (id, estado) => {
    let notasCancelacion = null;
    if (estado === "cancelada") {
      const motivo = await promptInput({
        title: "Cancelar cita",
        message: "Ingresa el motivo de cancelación de la cita (obligatorio).",
        placeholder: "Ej. Propietario solicitó reprogramación...",
        confirmLabel: "Cancelar cita",
      });
      if (motivo === null) return;
      if (motivo.trim().length < 3) {
        return notify.error("Debes ingresar un motivo de cancelación (mínimo 3 caracteres).");
      }
      notasCancelacion = motivo.trim();
    }
    try { 
      await api.patch(`/citas/${id}/estado`, { estado, notas_cancelacion: notasCancelacion }); 
      loadCitas(); 
    } catch (err) { 
      notify.error(err.response?.data?.message || "Error al actualizar estado."); 
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Eliminar cita",
      message: "¿Confirma que desea eliminar esta cita de la agenda?",
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!ok) return;
    try { 
      await api.delete(`/citas/${id}`); 
      loadCitas(); 
      notify.success("Cita eliminada de la agenda.");
    } catch (err) { 
      notify.error(err.response?.data?.message || "Error al eliminar cita."); 
    }
  };

  const openAtenderModal = (cita) => {
    navigate(`/atender/${cita.id}`, { state: { cita, from: "/agenda" } });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!selectedCliente) errors.cliente = true;
    if (!selectedMascotaId) errors.mascota = true;
    if (!selectedUsuarioId) errors.veterinario = true;
    if (!fechaInput) errors.fecha = true;
    if (!horaInput) errors.hora = true;
    if (!motivoInput.trim()) errors.motivo = true;

    setInvalidFields(errors);

    if (Object.keys(errors).length > 0) {
      return setFormError("Por favor completa todos los campos obligatorios marcados con (*).");
    }

    if (motivoInput.trim().length < 3) {
      errors.motivo = true;
      setInvalidFields(errors);
      return setFormError("El motivo de la consulta debe tener al menos 3 caracteres.");
    }

    const fechaHoraConcat = `${fechaInput}T${horaInput}:00`;
    const citaDate = new Date(fechaHoraConcat);
    const ahora = new Date();

    if (citaDate < new Date(ahora.getTime() - 5 * 60 * 1000)) {
      errors.fecha = true;
      errors.hora = true;
      setInvalidFields(errors);
      return setFormError("No es posible agendar citas en fechas u horas pasadas.");
    }

    const [horaH, horaM] = horaInput.split(":").map(Number);
    if (horaH < 7 || (horaH === 20 && horaM > 0) || horaH > 20) {
      errors.hora = true;
      setInvalidFields(errors);
      return setFormError("El horario de atención es de 07:00 AM a 08:00 PM.");
    }
    const mascotaNombre   = selectedCliente?.mascotas?.find(m => String(m.id) === String(selectedMascotaId))?.nombre || "Mascota";
    const vetNombre       = veterinarios.find(v => String(v.id) === String(selectedUsuarioId))?.nombre || "Veterinario";
    const fechaDisplay    = `${formatDateDisplay(fechaInput)} a las ${horaInput}`;

    try {
      setGuardando(true); 
      setFormError("");
      await api.post("/citas", { 
        mascota_id: Number(selectedMascotaId), 
        usuario_id: Number(selectedUsuarioId), 
        fecha_hora: fechaHoraConcat, 
        motivo: motivoInput.trim() 
      });
      
      // Cerrar y limpiar modal
      setModalOpen(false);
      setSelectedCliente(null); 
      setClienteQuery(""); 
      setSelectedMascotaId("");
      setSelectedUsuarioId(""); 
      setFechaInput(todayStr); 
      setHoraInput("09:00");
      setMotivoInput("");
      setInvalidFields({});
      
      loadCitas();
      showSuccess({ mascota: mascotaNombre, vet: vetNombre, fecha: fechaDisplay });
    } catch (err) { 
      setFormError(err.response?.data?.message || "Error al registrar la cita."); 
    } finally { 
      setGuardando(false); 
    }
  };

  const filteredClientes = clienteQuery.trim() === "" ? [] :
    clientes.filter(c => {
      const q = clienteQuery.toLowerCase().trim();
      const nombre = String(c.nombre || "").toLowerCase();
      const telefono = String(c.telefono || "").toLowerCase();
      const correo = String(c.correo || "").toLowerCase();
      const cedula = String(c.cedula || "").toLowerCase();
      const mascotaMatch = (c.mascotas || []).some(m =>
        String(m.nombre || "").toLowerCase().includes(q)
      );
      return nombre.includes(q) || telefono.includes(q) || correo.includes(q) || cedula.includes(q) || mascotaMatch;
    });

  // Conteos consistentes y exactos basados en la totalidad de citas del día/período
  const countTodas      = citas.length;
  const countPendientes = citas.filter(c => c.estado === "pendiente").length;
  const countAtendidas  = citas.filter(c => c.estado === "atendida").length;
  const countCanceladas = citas.filter(c => c.estado === "cancelada").length;

  // Filtrado de citas mostrado en la tabla según el estado seleccionado
  const citasFiltradas = estadoFiltro 
    ? citas.filter(c => c.estado === estadoFiltro) 
    : citas;

  return (
    <div className="space-y-6 animate-fade-in pb-6">

      {/* Cabecera Principal */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="page-title capitalize">Agenda Diaria</h1>
          <p className="page-subtitle font-medium text-slate-600 capitalize">
            {fechaFiltro ? formatDateDisplay(fechaFiltro) : "Todas las citas registradas"}
          </p>
        </div>
        {isAdminOrRec && (
          <button onClick={() => setModalOpen(true)} className="btn-action-create w-full sm:w-auto justify-center">
            <Plus size={16} weight="bold" />
            <span>Agendar Cita</span>
          </button>
        )}
      </div>

      {/* Feedback de Éxito (Toast Banner Vibrante) */}
      {successMsg && (
        <div className="animate-fade-in flex items-start gap-4 px-5 py-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <CheckCircle size={22} weight="fill" />
          </div>
          <div className="flex-1 min-w-0">
            {successMsg.tipo === "atencion" ? (
              <>
                <p className="font-bold text-base leading-tight">
                  ¡Consulta Médica Registrada y Cita Atendida!
                </p>
                <p className="text-sm mt-1 leading-relaxed text-emerald-800">
                  Se guardó la evolución clínica de <strong>{successMsg.mascota}</strong> en su historia clínica.{" "}
                  {successMsg.mascotaId && (
                    <Link
                      to={`/mascotas/${successMsg.mascotaId}`}
                      className="inline-flex items-center gap-1 font-extrabold text-emerald-900 underline hover:text-emerald-700 ml-1">
                      <span>Ver expediente clínico</span>
                      <ArrowSquareOut size={14} weight="bold" />
                    </Link>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-base leading-tight">
                  ¡Cita Agendada Exitosamente!
                </p>
                <p className="text-sm mt-1 leading-relaxed text-emerald-800">
                  <strong>{successMsg.mascota}</strong> quedó programada con el <strong>Dr(a). {successMsg.vet}</strong> para el <strong>{successMsg.fecha}</strong>.
                </p>
              </>
            )}
          </div>
          <button 
            onClick={() => setSuccessMsg(null)}
            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-all">
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Panel de Filtros y Búsqueda */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <CalendarBlank size={16} className="text-sky-600" />
            Filtros de Agenda
          </span>

          {/* Botón "Limpiar Filtros" claramente diferenciado como Botón Secundario */}
          <button 
            onClick={() => { setFechaFiltro(todayStr); setEstadoFiltro(""); }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all active:scale-[0.98]">
            <ArrowCounterClockwise size={14} weight="bold" className="text-slate-500" />
            <span>Restablecer hoy</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Selector de Fecha */}
          <div className="md:col-span-4">
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Filtrar por fecha</label>
              {fechaFiltro && (
                <button
                  type="button"
                  onClick={() => setFechaFiltro("")}
                  className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline">
                  Ver todas las fechas
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                ref={filtroFechaRef}
                type="date" 
                value={fechaFiltro} 
                onChange={e => setFechaFiltro(e.target.value)} 
                className="input-field picker-custom pr-12 cursor-pointer" 
              />
              <button
                type="button"
                onClick={() => openPicker(filtroFechaRef)}
                title="Abrir calendario"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-xs transition-all active:scale-95">
                <CalendarBlank size={16} weight="bold" />
              </button>
            </div>
          </div>

          {/* Botones de Estado con Conteos Integrados */}
          <div className="md:col-span-8">
            <label className="label">Estado de la Cita</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
              {[
                { val: "", label: "Todas", count: countTodas },
                { val: "pendiente", label: "Pendientes", count: countPendientes },
                { val: "atendida", label: "Atendidas", count: countAtendidas },
                { val: "cancelada", label: "Canceladas", count: countCanceladas }
              ].map(btn => (
                <button 
                  key={btn.val} 
                  type="button" 
                  onClick={() => setEstadoFiltro(btn.val)}
                  className={`py-2 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 select-none ${
                    estadoFiltro === btn.val 
                      ? "bg-white text-sky-700 shadow-xs border border-slate-200" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}>
                  <span>{btn.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    estadoFiltro === btn.val ? "bg-sky-100 text-sky-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {btn.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm font-semibold">
          <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista / Tabla de Citas */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cargando agenda...</p>
        </div>
      ) : citas.length === 0 ? (
        /* Empty State General (No hay ninguna cita para la fecha) */
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-14 px-6 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center text-3xl mb-4 shadow-xs">
            📅
          </div>
          <h3 className="font-bold text-lg text-slate-900">
            No hay citas registradas para este día
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            No se encontraron consultas agendadas para la fecha <strong className="capitalize">{formatDateDisplay(fechaFiltro)}</strong>.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
            {isAdminOrRec && (
              <button 
                onClick={() => setModalOpen(true)}
                className="btn-action-create">
                <Plus size={16} weight="bold" />
                <span>Agendar Cita para esta Fecha</span>
              </button>
            )}
            <button 
              onClick={() => { setFechaFiltro(todayStr); setEstadoFiltro(""); }}
              className="btn-action-secondary">
              <ArrowCounterClockwise size={15} />
              <span>Ver Citas de Hoy</span>
            </button>
          </div>
        </div>
      ) : citasFiltradas.length === 0 ? (
        /* Empty State por Filtro (Hay citas en el día, pero ninguna con este estado) */
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-12 px-6 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center text-2xl mb-3 shadow-xs">
            🔍
          </div>
          <h3 className="font-bold text-base text-slate-900">
            No hay citas con estado "{estadoFiltro}"
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Hay {citas.length} {citas.length === 1 ? "cita registrada" : "citas registradas"} para esta fecha, pero ninguna se encuentra en estado <strong className="capitalize">{estadoFiltro}</strong>.
          </p>
          <div className="mt-4">
            <button 
              onClick={() => setEstadoFiltro("")}
              className="btn-action-secondary text-xs">
              <ArrowCounterClockwise size={14} />
              <span>Ver Todas las Citas ({countTodas})</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Hora", "Paciente", "Propietario", "Atiende", "Motivo", "Estado", "Acciones"].map(h => (
                    <th key={h} className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {citasFiltradas.map((cita) => {
                  const est = ESTADO_STYLES[cita.estado] ?? ESTADO_STYLES.pendiente;
                  return (
                    <tr key={cita.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <Clock size={15} className="text-sky-600" />
                          {formatTime(cita.fecha_hora)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-base flex-shrink-0">
                            {getEspecieEmoji(cita.especie)}
                          </div>
                          <div>
                            <Link
                              to={`/mascotas/${cita.mascota_id}`}
                              title="Ver expediente e historia clínica"
                              className="font-bold text-sm text-slate-900 hover:text-sky-600 hover:underline leading-none inline-flex items-center gap-1">
                              <span>{cita.mascota_nombre}</span>
                            </Link>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">{cita.especie}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" />
                          {cita.cliente_nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-slate-400" />
                          {cita.telefono}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                          <Stethoscope size={15} className="text-sky-600" />
                          Dr(a). {cita.veterinario_nombre}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px] truncate text-xs text-slate-600" title={cita.motivo}>
                        <span className="flex items-center gap-1">
                          <Chat size={13} className="text-slate-400 flex-shrink-0" />
                          {cita.motivo}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${est.bg}`}>
                          {est.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 justify-end">
                          {cita.estado === "pendiente" && (
                            <>
                              {canAtender ? (
                                <button
                                  onClick={() => openAtenderModal(cita)}
                                  title="Abrir formulario de atención médica y registrar historia clínica"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95">
                                  <Stethoscope size={15} weight="bold" />
                                  <span>Atender Cita</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUpdateStatus(cita.id, "atendida")} 
                                  title="Marcar como atendida"
                                  className="w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-2xs">
                                  <Check size={14} weight="bold" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleUpdateStatus(cita.id, "cancelada")} 
                                title="Cancelar cita"
                                className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-2xs">
                                <X size={14} weight="bold" />
                              </button>
                            </>
                          )}
                          {cita.estado === "atendida" && (
                            <Link
                              to={`/mascotas/${cita.mascota_id}`}
                              title="Ver historia clínica de la mascota"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 text-[11px] font-bold transition-all">
                              <ClipboardText size={13} weight="bold" />
                              <span>Ver Historia</span>
                            </Link>
                          )}
                          {cita.estado !== "pendiente" && (
                            <button 
                              onClick={() => handleUpdateStatus(cita.id, "pendiente")} 
                              title="Restablecer a pendiente"
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold uppercase transition-all">
                              Restablecer
                            </button>
                          )}
                          {isAdminOrRec && (
                            <button 
                              onClick={() => handleDelete(cita.id)} 
                              title="Eliminar cita"
                              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all active:scale-90 ml-1">
                              <Trash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL "AGENDAR NUEVA CITA" — Rediseñado al Dark Theme Integrado ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div className="w-full max-w-xl rounded-t-3xl sm:rounded-2xl border border-slate-800 bg-[#0F172A] text-slate-100 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  <CalendarBlank size={18} weight="bold" />
                </div>
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight truncate">
                  Agendar Nueva Cita Médica
                </h2>
              </div>
              <button 
                onClick={() => { 
                  setModalOpen(false); 
                  setSelectedCliente(null); 
                  setClienteQuery(""); 
                  setSelectedMascotaId(""); 
                  setSelectedUsuarioId(""); 
                  setMotivoInput(""); 
                  setFormError(""); 
                  setInvalidFields({});
                }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all flex-shrink-0">
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Formulario del Modal */}
            <form onSubmit={handleBook} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Alerta de Error con Validación Visible */}
              {formError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs font-semibold">
                  <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Propietario / Cliente (*) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Propietario / Cliente <span className="text-rose-400">*</span>
                </label>
                {!selectedCliente ? (
                  <div className="relative">
                    <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar cliente por nombre, teléfono o cédula..." 
                      value={clienteQuery}
                      onChange={e => setClienteQuery(e.target.value)} 
                      className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-sky-500 ${
                        invalidFields.cliente ? "border-rose-500" : "border-slate-700"
                      }`} 
                    />
                    {filteredClientes.length > 0 && (
                      <div className="absolute w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-800">
                        {filteredClientes.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => { 
                              setSelectedCliente(c); 
                              setClienteQuery(""); 
                              setSelectedMascotaId(c.mascotas[0]?.id || ""); 
                            }}
                            className="p-3 cursor-pointer hover:bg-slate-800 transition-colors">
                            <p className="font-bold text-xs text-white">{c.nombre}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wide">
                              {c.cedula ? `C.C. ${c.cedula} • ` : ""}Tel: {c.telefono || "N/A"}{c.correo ? ` • ${c.correo}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-sky-500/40 bg-sky-950/30">
                    <div>
                      <p className="font-bold text-xs text-sky-300">{selectedCliente.nombre}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {selectedCliente.cedula ? `C.C. ${selectedCliente.cedula} • ` : ""}Tel: {selectedCliente.telefono || "N/A"}{selectedCliente.correo ? ` • ${selectedCliente.correo}` : ""}
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedCliente(null); setSelectedMascotaId(""); }}
                      className="text-xs font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300">
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Seleccionar Mascota (*) */}
              {selectedCliente && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Mascota de {selectedCliente.nombre} <span className="text-rose-400">*</span>
                  </label>
                  {selectedCliente.mascotas.length === 0 ? (
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/30 text-amber-300 text-xs">
                      ⚠️ Este cliente no tiene mascotas registradas. Registra una mascota antes de agendar la cita.
                    </div>
                  ) : (
                    <select 
                      value={selectedMascotaId} 
                      onChange={e => setSelectedMascotaId(e.target.value)} 
                      className={`w-full h-11 px-3.5 rounded-xl border bg-slate-900 text-white text-xs font-medium focus:outline-none focus:border-sky-500 ${
                        invalidFields.mascota ? "border-rose-500" : "border-slate-700"
                      }`}>
                      <option value="" disabled>-- Selecciona la mascota --</option>
                      {selectedCliente.mascotas.map(m => (
                        <option key={m.id} value={m.id}>
                          {getEspecieEmoji(m.especie)} {m.nombre} ({m.especie} • {m.raza})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* 3. Veterinario que atiende (Datos reales del sistema) (*) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Veterinario que Atiende <span className="text-rose-400">*</span>
                </label>
                <select 
                  value={selectedUsuarioId} 
                  onChange={e => setSelectedUsuarioId(e.target.value)} 
                  className={`w-full h-11 px-3.5 rounded-xl border bg-slate-900 text-white text-xs font-medium focus:outline-none focus:border-sky-500 ${
                    invalidFields.veterinario ? "border-rose-500" : "border-slate-700"
                  }`}>
                  <option value="" disabled>-- Selecciona un profesional médico --</option>
                  {veterinarios.map(v => (
                    <option key={v.id} value={v.id}>
                      Dr(a). {v.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Fecha y Hora en Campos Separados con Botones de Calendario y Reloj Resaltados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Fecha de la Cita <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      ref={modalFechaRef}
                      type="date" 
                      min={todayStr}
                      value={fechaInput} 
                      onChange={e => setFechaInput(e.target.value)} 
                      style={{ colorScheme: "dark" }}
                      className={`picker-custom w-full h-11 pl-3.5 pr-12 rounded-xl border bg-slate-900 text-white text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer ${
                        invalidFields.fecha ? "border-rose-500" : "border-slate-700"
                      }`} 
                    />
                    <button
                      type="button"
                      onClick={() => openPicker(modalFechaRef)}
                      title="Seleccionar fecha en el calendario"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-950/60 transition-all active:scale-95">
                      <CalendarBlank size={16} weight="bold" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Hora de la Cita <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      ref={modalHoraRef}
                      type="time" 
                      value={horaInput} 
                      onChange={e => setHoraInput(e.target.value)} 
                      style={{ colorScheme: "dark" }}
                      className={`picker-custom w-full h-11 pl-3.5 pr-12 rounded-xl border bg-slate-900 text-white text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer ${
                        invalidFields.hora ? "border-rose-500" : "border-slate-700"
                      }`} 
                    />
                    <button
                      type="button"
                      onClick={() => openPicker(modalHoraRef)}
                      title="Seleccionar hora en el reloj"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-950/60 transition-all active:scale-95">
                      <Clock size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4b. Disponibilidad en vivo del médico para la fecha elegida */}
              {selectedUsuarioId && fechaInput && (() => {
                const slots = [];
                for (let h = 7; h <= 19; h++) {
                  if (h > 7) slots.push(`${String(h).padStart(2, "0")}:00`);
                  slots.push(`${String(h).padStart(2, "0")}:30`);
                }

                const citasVet = citasDiaModal.filter(
                  (c) => String(c.veterinario_id) === String(selectedUsuarioId) && c.estado !== "cancelada"
                );

                const isSlotOccupied = (slotStr) => {
                  const slotStart = new Date(`${fechaInput}T${slotStr}:00`).getTime();
                  const slotEnd = slotStart + 30 * 60 * 1000;
                  return citasVet.some((c) => {
                    const cStart = new Date(c.fecha_hora).getTime();
                    const cEnd = cStart + 30 * 60 * 1000;
                    return cStart < slotEnd && cEnd > slotStart;
                  });
                };

                const ahoraMs = Date.now() - 5 * 60 * 1000;
                const horaActualOcupada = horaInput ? isSlotOccupied(horaInput) : false;

                return (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Disponibilidad del médico ({formatDateDisplay(fechaInput)})
                      </span>
                      <div className="flex items-center gap-3 text-[10px] font-semibold">
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Libre
                        </span>
                        <span className="inline-flex items-center gap-1 text-rose-300">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> Ocupada
                        </span>
                        <span className="inline-flex items-center gap-1 text-sky-300">
                          <span className="w-2 h-2 rounded-full bg-sky-500" /> Elegida
                        </span>
                      </div>
                    </div>

                    {loadingDisp ? (
                      <p className="text-[11px] text-slate-400">Consultando horarios...</p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {slots.map((slot) => {
                          const ocupada = isSlotOccupied(slot);
                          const pasada = new Date(`${fechaInput}T${slot}:00`).getTime() < ahoraMs;
                          const elegida = horaInput === slot;

                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={ocupada || pasada}
                              onClick={() => setHoraInput(slot)}
                              title={ocupada ? "Hora ocupada por otra cita" : pasada ? "Hora pasada" : `Seleccionar ${slot}`}
                              className={`h-8 rounded-lg text-[11px] font-bold border transition-all ${
                                ocupada
                                  ? "bg-rose-950/70 border-rose-500/80 text-rose-300 line-through cursor-not-allowed"
                                  : pasada
                                  ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                                  : elegida
                                  ? "bg-sky-600 border-sky-400 text-white shadow-sm"
                                  : "bg-slate-900 border-slate-700 text-slate-200 hover:border-emerald-500/70 hover:text-emerald-300"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {horaActualOcupada && (
                      <p className="text-[11px] font-semibold text-rose-400">
                        ⚠️ La hora {horaInput} se cruza con una cita ya agendada para este médico. Selecciona una franja libre.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* 5. Motivo de Consulta (*) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Motivo de la Consulta <span className="text-rose-400">*</span>
                </label>
                <textarea 
                  placeholder="Describa el motivo médico (ej. vacunación anual, desparasitación, control preventivo)..." 
                  value={motivoInput}
                  onChange={e => setMotivoInput(e.target.value)} 
                  rows="2"
                  className={`w-full p-3.5 rounded-xl border bg-slate-900 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none ${
                    invalidFields.motivo ? "border-rose-500" : "border-slate-700"
                  }`}
                />
              </div>

              </div>

              {/* Botones de Acción Fijos en la Parte Inferior */}
              <div className="px-5 sm:px-6 py-4 bg-slate-900/95 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 flex-shrink-0">
                <button 
                  type="button" 
                  onClick={() => { 
                    setModalOpen(false); 
                    setSelectedCliente(null); 
                    setClienteQuery(""); 
                    setSelectedMascotaId(""); 
                    setSelectedUsuarioId(""); 
                    setMotivoInput(""); 
                    setFormError(""); 
                    setInvalidFields({});
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 h-11 rounded-xl font-bold text-xs text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 transition-all" 
                  disabled={guardando}>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-action-create w-full sm:w-auto justify-center" 
                  disabled={guardando}>
                  {guardando ? (
                    <>
                      <Spinner size="sm" />
                      <span>Agendando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} weight="bold" />
                      <span>Confirmar y Agendar Cita</span>
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
