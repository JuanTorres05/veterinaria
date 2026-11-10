import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import api from "../services/api";
import {
  User, Phone, Envelope, Plus, Trash, Check, WarningCircle, Notebook,
  Cat, ArrowRight, ArrowLeft, CheckCircle, FolderUser, CalendarBlank
} from "@phosphor-icons/react";

/* Constantes iniciales */
const MASCOTA_INIT = { nombre: "", especie: "Perro", raza: "", sexo: "Desconocido", fechaNacimiento: "", pesoKg: "", color: "" };
const FORM_INIT    = { cliente: { nombre: "", cedula: "", direccion: "", telefono: "", correo: "" }, mascotas: [{ ...MASCOTA_INIT }] };
const nombreRegex   = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]+$/;
const cedulaRegex   = /^[a-zA-Z0-9-]+$/;
const telefonoRegex = /^[0-9+\-\s]{7,15}$/;
const correoRegex   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const todayStr = (() => {
  const t = new Date();
  return new Date(t - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
})();

const ESPECIES = [
  { value: "Perro",  icon: "🐕", label: "Perro"  },
  { value: "Gato",   icon: "🐈", label: "Gato"   },
  { value: "Ave",    icon: "🦜", label: "Ave"     },
  { value: "Conejo", icon: "🐇", label: "Conejo"  },
  { value: "Reptil", icon: "🦎", label: "Reptil"  },
  { value: "Otro",   icon: "🐾", label: "Otro"    },
];

const PET_PALETTE = [
  { accent: "#0284C7", bg: "#F0F9FF", bd: "#BAE6FD" }, // Cyan/Sky
  { accent: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" }, // Emerald
  { accent: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE" }, // Purple
  { accent: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" }, // Amber
  { accent: "#E11D48", bg: "#FFF1F2", bd: "#FECDD3" }, // Rose
];

const STEPS = [
  { id: 1, label: "Propietario", desc: "Datos de contacto" },
  { id: 2, label: "Mascotas",   desc: "Datos clínicos" },
  { id: 3, label: "Resumen",    desc: "Confirmación" },
];

function getPalette(i) { return PET_PALETTE[i % PET_PALETTE.length]; }

/* Helpers de Validación */
function validateCliente(cliente) {
  const e = {};
  const nombre = (cliente.nombre || "").trim();
  if (!nombre) {
    e.nombre = "El nombre del cliente es obligatorio.";
  } else if (nombre.length < 3) {
    e.nombre = "El nombre debe tener al menos 3 caracteres.";
  } else if (!nombreRegex.test(nombre)) {
    e.nombre = "El nombre solo puede contener letras y espacios.";
  }

  const cedula = (cliente.cedula || "").trim();
  if (!cedula) {
    e.cedula = "El número de cédula es obligatorio.";
  } else if (cedula.length < 5 || cedula.length > 20) {
    e.cedula = "La cédula debe tener entre 5 y 20 caracteres.";
  } else if (!cedulaRegex.test(cedula)) {
    e.cedula = "La cédula solo puede contener números, letras o guiones.";
  }

  const tel = (cliente.telefono || "").trim();
  if (!tel) {
    e.telefono = "El teléfono celular es obligatorio.";
  } else if (!telefonoRegex.test(tel) || tel.replace(/\D/g, '').length < 7) {
    e.telefono = "Ingresa un número telefónico válido (mínimo 7 dígitos).";
  }

  const correo = (cliente.correo || "").trim();
  if (!correo) {
    e.correo = "El correo electrónico es obligatorio.";
  } else if (!correoRegex.test(correo)) {
    e.correo = "Ingresa una dirección de correo válida (ej. usuario@correo.com).";
  }

  return e;
}

function validateMascotas(mascotas) {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 35);

  return mascotas.map(m => {
    const e = {};
    const nombre = (m.nombre || "").trim();
    if (!nombre) {
      e.nombre = "El nombre de la mascota es obligatorio.";
    } else if (nombre.length < 2) {
      e.nombre = "El nombre debe tener al menos 2 caracteres.";
    }

    if (!m.especie || !m.especie.trim()) {
      e.especie = "Selecciona una especie.";
    }

    const raza = (m.raza || "").trim();
    if (!raza) {
      e.raza = "La raza es obligatoria.";
    } else if (raza.length < 2) {
      e.raza = "La raza debe tener al menos 2 caracteres.";
    }

    if (m.fechaNacimiento) {
      const fecha = new Date(m.fechaNacimiento);
      if (isNaN(fecha.getTime())) {
        e.fechaNacimiento = "Fecha no válida.";
      } else if (fecha > hoy) {
        e.fechaNacimiento = "La fecha de nacimiento no puede ser en el futuro.";
      } else if (fecha < minDate) {
        e.fechaNacimiento = "La fecha no puede ser mayor a 35 años atrás.";
      }
    }

    if (m.pesoKg !== "" && m.pesoKg !== null && m.pesoKg !== undefined) {
      const peso = Number(m.pesoKg);
      if (isNaN(peso) || peso <= 0) {
        e.pesoKg = "El peso debe ser mayor a 0 kg.";
      } else if (peso > 300) {
        e.pesoKg = "El peso no puede superar 300 kg.";
      }
    }

    return e;
  });
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] mt-1.5 font-bold text-rose-600 select-none">
      <span>▲</span>{msg}
    </p>
  );
}

function FieldLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
      {children}{required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}

/* Stepper Header */
function StepperHeader({ step }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, idx) => {
        const status = s.id < step ? "done" : s.id === step ? "active" : "pending";
        const isLast = idx === STEPS.length - 1;
        return (
          <div key={s.id} className="flex items-center flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                status === "done" 
                  ? "bg-emerald-600 text-white shadow-xs"
                  : status === "active"
                  ? "bg-sky-600 text-white ring-4 ring-sky-100 shadow-xs"
                  : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}>
                {status === "done" ? <Check size={14} weight="bold" /> : s.id}
              </div>
              <div className="hidden sm:block">
                <p className={`text-xs font-bold ${status === "pending" ? "text-slate-400" : "text-slate-900"}`}>
                  {s.label}
                </p>
                <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  {s.desc}
                </p>
              </div>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-3 transition-colors ${
                status === "done" ? "bg-emerald-600" : "bg-slate-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Tarjeta de Mascota */
function PetCard({ mascota, index, onUpdate, onRemove, errors, canRemove }) {
  const p = getPalette(index);
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs">
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ backgroundColor: p.bg, borderColor: p.bd }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.accent }}>
            {index + 1}
          </div>
          <span className="font-bold text-sm text-slate-900">
            <Cat size={16} className="inline mr-1.5 text-slate-700" weight="bold" />
            {mascota.nombre.trim() ? mascota.nombre : `Mascota #${index + 1}`}
          </span>
        </div>
        
        {/* Modal de confirmación previa antes de eliminar */}
        {canRemove && (
          <button 
            type="button" 
            onClick={() => onRemove(index)}
            className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all active:scale-[0.96]">
            <Trash size={13} />
            <span>Eliminar</span>
          </button>
        )}
      </div>

      <div className="p-5 space-y-4 bg-white">
        <div>
          <FieldLabel htmlFor={`m-nombre-${index}`} required>Nombre de la mascota</FieldLabel>
          <input 
            id={`m-nombre-${index}`} 
            type="text" 
            placeholder="Ej. Max, Luna, Toby..."
            value={mascota.nombre} 
            onChange={e => onUpdate(index, "nombre", e.target.value)}
            className={`input-field ${errors?.nombre ? "border-rose-500 ring-1 ring-rose-500" : ""}`} 
          />
          <FieldError msg={errors?.nombre} />
        </div>

        <div>
          <FieldLabel required>Especie</FieldLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ESPECIES.map(esp => {
              const sel = mascota.especie === esp.value;
              return (
                <button 
                  key={esp.value} 
                  type="button" 
                  onClick={() => onUpdate(index, "especie", esp.value)}
                  className={`flex flex-col items-center justify-center gap-1 h-16 rounded-xl border-2 transition-all select-none active:scale-[0.95] ${
                    sel 
                      ? "border-sky-600 bg-sky-50 text-sky-900 font-bold shadow-xs" 
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 font-medium"
                  }`}>
                  <span className="text-xl">{esp.icon}</span>
                  <span className="text-[10px] uppercase tracking-wider">{esp.label}</span>
                </button>
              );
            })}
          </div>
          <FieldError msg={errors?.especie} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor={`m-raza-${index}`} required>Raza</FieldLabel>
            <input 
              id={`m-raza-${index}`} 
              type="text" 
              placeholder="Ej. Golden Retriever, Persa, Criolla..."
              value={mascota.raza} 
              onChange={e => onUpdate(index, "raza", e.target.value)}
              className={`input-field ${errors?.raza ? "border-rose-500 ring-1 ring-rose-500" : ""}`} 
            />
            <FieldError msg={errors?.raza} />
          </div>

          <div>
            <FieldLabel>Sexo</FieldLabel>
            <select
              value={mascota.sexo}
              onChange={e => onUpdate(index, "sexo", e.target.value)}
              className="input-field">
              <option value="Desconocido">Desconocido</option>
              <option value="Macho">Macho</option>
              <option value="Hembra">Hembra</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel htmlFor={`m-nacimiento-${index}`}>Fecha de nacimiento</FieldLabel>
            <div className="relative">
              <input
                id={`m-nacimiento-${index}`}
                type="date"
                max={todayStr}
                value={mascota.fechaNacimiento}
                onChange={e => onUpdate(index, "fechaNacimiento", e.target.value)}
                className={`input-field picker-custom pr-12 cursor-pointer ${errors?.fechaNacimiento ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(`m-nacimiento-${index}`);
                  if (el?.showPicker) {
                    try { el.showPicker(); return; } catch { /* fallback */ }
                  }
                  el?.focus();
                }}
                title="Seleccionar fecha de nacimiento"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-xs transition-all active:scale-95">
                <CalendarBlank size={16} weight="bold" />
              </button>
            </div>
            <FieldError msg={errors?.fechaNacimiento} />
          </div>

          <div>
            <FieldLabel htmlFor={`m-peso-${index}`}>Peso (kg)</FieldLabel>
            <input
              id={`m-peso-${index}`}
              type="number"
              step="0.1"
              min="0.1"
              max="300"
              placeholder="Ej. 4.5"
              value={mascota.pesoKg}
              onChange={e => onUpdate(index, "pesoKg", e.target.value)}
              className={`input-field ${errors?.pesoKg ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
            />
            <FieldError msg={errors?.pesoKg} />
          </div>

          <div>
            <FieldLabel htmlFor={`m-color-${index}`}>Color / pelaje</FieldLabel>
            <input
              id={`m-color-${index}`}
              type="text"
              placeholder="Ej. Negro con blanco"
              value={mascota.color}
              onChange={e => onUpdate(index, "color", e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Fila Resumen */
function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-sm font-extrabold text-slate-900 text-right ml-4">{value || "—"}</span>
    </div>
  );
}

/* Componente Principal */
export default function RegistrarPage() {
  const navigate = useNavigate();
  const [step,        setStep]        = useState(1);
  const [form,        setForm]        = useState(FORM_INIT);
  const [errors,      setErrors]      = useState({ cliente: {}, mascotas: [{}] });
  const [loading,     setLoading]     = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [apiError,    setApiError]    = useState("");

  function setCliente(field, value) { 
    setForm(f => ({ ...f, cliente: { ...f.cliente, [field]: value } })); 
  }

  function updateMascota(index, field, value) {
    setForm(f => ({ ...f, mascotas: f.mascotas.map((m, i) => i === index ? { ...m, [field]: value } : m) }));
  }

  function addMascota() {
    if (form.mascotas.length >= 10) return;
    setForm(f => ({ ...f, mascotas: [...f.mascotas, { ...MASCOTA_INIT }] }));
    setErrors(e => ({ ...e, mascotas: [...e.mascotas, {}] }));
  }

  /* Confirmación de acción destructiva antes de eliminar una mascota del formulario */
  function removeMascota(index) {
    if (form.mascotas.length <= 1) return;
    const petName = form.mascotas[index]?.nombre.trim() || `Mascota #${index + 1}`;
    if (window.confirm(`¿Confirma que desea remover a ${petName} de la lista de registro?`)) {
      setForm(f => ({ ...f, mascotas: f.mascotas.filter((_, i) => i !== index) }));
      setErrors(e => ({ ...e, mascotas: e.mascotas.filter((_, i) => i !== index) }));
    }
  }

  /* Navegación por pasos con Validación Real */
  function goNext() {
    if (step === 1) {
      const ce = validateCliente(form.cliente);
      if (Object.keys(ce).length) { 
        setErrors(e => ({ ...e, cliente: ce })); 
        return; 
      }
      setErrors(e => ({ ...e, cliente: {} }));
    }

    if (step === 2) {
      const me = validateMascotas(form.mascotas);
      if (me.some(m => Object.keys(m).length)) { 
        setErrors(e => ({ ...e, mascotas: me })); 
        return; 
      }
      setErrors(e => ({ ...e, mascotas: form.mascotas.map(() => ({})) }));
    }

    setStep(s => Math.min(s + 1, 3));
  }

  function goBack() { setStep(s => Math.max(s - 1, 1)); }

  function resetWizard() {
    setForm(FORM_INIT);
    setErrors({ cliente: {}, mascotas: [{}] });
    setSuccessData(null);
    setApiError("");
    setStep(1);
  }

  /* Envío a API */
  async function handleSubmit() {
    setLoading(true);
    setApiError("");
    try {
      const { data } = await api.post("/clientes/registrar", form);
      setSuccessData(data);
      setStep(4); // Transicionar a Pantalla de Éxito Persistente
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const status = err.response?.status;
      const body   = err.response?.data;
      if (status === 409) {
        setApiError(body?.message || "Ya existe un cliente registrado con esta cédula o correo electrónico.");
        setStep(1);
      }
      else if (status === 400 && body?.errors) {
        const mapped = { cliente: {}, mascotas: form.mascotas.map(() => ({})) };
        body.errors.forEach(({ path, message }) => {
          const parts = path.split(".");
          if (parts[0] === "cliente" && parts[1]) mapped.cliente[parts[1]] = message;
          else if (parts[0] === "mascotas" && parts[2]) {
            const idx = Number(parts[1]);
            if (!isNaN(idx)) mapped.mascotas[idx][parts[2]] = message;
          }
        });
        setErrors(mapped);
        setStep(1);
      }
      else if (status === 403) setApiError("No tienes permisos suficientes para realizar esta acción.");
      else setApiError(body?.message || "Error al procesar el registro. Por favor intente nuevamente.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-6">

      {/* Cabecera Principal Unificada */}
      <div className="flex items-center gap-3.5 pb-2 border-b border-slate-200">
        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 shadow-xs">
          <Notebook size={22} weight="fill" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Wizard de Registro
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Alta de propietario y mascotas en una sola transacción clínica
          </p>
        </div>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold">
          <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-600" />
          <span>{apiError}</span>
        </div>
      )}

      {/* ── PASO 4: PANTALLA DE ÉXITO PERSISTENTE CON CTAs EXPLÍCITOS ── */}
      {step === 4 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-6 shadow-xs animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-xs">
            <CheckCircle size={36} weight="fill" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              ¡Registro Completado Exitosamente!
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              El propietario <strong className="text-slate-900">{successData?.cliente?.nombre}</strong> y su(s) mascota(s) <strong className="text-slate-900">{successData?.mascotas?.map(m => m.nombre).join(", ")}</strong> quedaron dados de alta correctamente en el sistema.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <Link 
              to="/pacientes" 
              className="btn-action-create">
              <FolderUser size={16} weight="bold" />
              <span>Ver Directorio de Pacientes</span>
            </Link>

            <button 
              onClick={resetWizard} 
              className="btn-action-secondary">
              <Plus size={16} weight="bold" />
              <span>Registrar Otro Cliente</span>
            </button>
          </div>
        </div>
      ) : (
        /* Tarjeta del Wizard Form */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <StepperHeader step={step} />

            {/* Paso 1: Datos del Propietario */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <FieldLabel htmlFor="c-nombre" required>Nombre completo del propietario</FieldLabel>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      id="c-nombre" 
                      type="text" 
                      placeholder="Ej. Ana García López"
                      value={form.cliente.nombre} 
                      onChange={e => setCliente("nombre", e.target.value)}
                      className={`input-field pl-10 ${errors.cliente.nombre ? "border-rose-500 ring-1 ring-rose-500" : ""}`} 
                    />
                  </div>
                  <FieldError msg={errors.cliente.nombre} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="c-cedula" required>Número de cédula / documento</FieldLabel>
                    <input 
                      id="c-cedula"
                      type="text"
                      placeholder="Ej. 1098765432"
                      value={form.cliente.cedula}
                      onChange={e => setCliente("cedula", e.target.value)}
                      className={`input-field ${errors.cliente?.cedula ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                    />
                    <FieldError msg={errors.cliente?.cedula} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="c-direccion">Dirección de residencia</FieldLabel>
                    <input
                      id="c-direccion"
                      type="text"
                      placeholder="Ej. Cra 15 #32-10, Apto 401"
                      value={form.cliente.direccion}
                      onChange={e => setCliente("direccion", e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="c-tel" required>Teléfono celular de contacto</FieldLabel>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        id="c-tel" 
                        type="tel" 
                        placeholder="3001234567"
                        value={form.cliente.telefono} 
                        onChange={e => setCliente("telefono", e.target.value)}
                        className={`input-field pl-10 ${errors.cliente.telefono ? "border-rose-500 ring-1 ring-rose-500" : ""}`} 
                      />
                    </div>
                    <FieldError msg={errors.cliente.telefono} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="c-correo" required>Correo electrónico</FieldLabel>
                    <div className="relative">
                      <Envelope size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        id="c-correo" 
                        type="email" 
                        placeholder="ana.garcia@correo.com"
                        value={form.cliente.correo} 
                        onChange={e => setCliente("correo", e.target.value)}
                        className={`input-field pl-10 ${errors.cliente.correo ? "border-rose-500 ring-1 ring-rose-500" : ""}`} 
                      />
                    </div>
                    <FieldError msg={errors.cliente.correo} />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Datos de las Mascotas */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  {/* Corregida concordancia singular/plural */}
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    {form.mascotas.length} {form.mascotas.length === 1 ? "Mascota Registrada" : "Mascotas Registradas"}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400">Máximo 10 por cliente</span>
                </div>

                {form.mascotas.map((mascota, i) => (
                  <PetCard 
                    key={i} 
                    mascota={mascota} 
                    index={i} 
                    onUpdate={updateMascota} 
                    onRemove={removeMascota}
                    errors={errors.mascotas?.[i]} 
                    canRemove={form.mascotas.length > 1} 
                  />
                ))}

                {form.mascotas.length < 10 && (
                  <button 
                    type="button" 
                    onClick={addMascota}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider select-none border-2 border-dashed border-sky-200 bg-sky-50/60 text-sky-800 hover:bg-sky-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                    <Plus size={15} weight="bold" />
                    <span>Agregar otra mascota a este propietario</span>
                  </button>
                )}
              </div>
            )}

            {/* Paso 3: Resumen Final */}
            {step === 3 && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Datos del Propietario
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 divide-y divide-slate-100">
                    <SummaryRow label="Nombre Completo"    value={form.cliente.nombre} />
                    <SummaryRow label="Cédula / Documento" value={form.cliente.cedula} />
                    <SummaryRow label="Teléfono"           value={form.cliente.telefono} />
                    <SummaryRow label="Correo Electrónico" value={form.cliente.correo} />
                    {form.cliente.direccion && <SummaryRow label="Dirección" value={form.cliente.direccion} />}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Mascotas a Registrar ({form.mascotas.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {form.mascotas.map((m, i) => {
                      const p = getPalette(i);
                      const esp = ESPECIES.find(e => e.value === m.especie);
                      return (
                        <div 
                          key={i} 
                          className="flex items-center gap-3 p-3.5 rounded-xl border"
                          style={{ backgroundColor: p.bg, borderColor: p.bd }}>
                          <span className="text-2xl">{esp?.icon || "🐾"}</span>
                          <div>
                            <p className="font-bold text-sm" style={{ color: p.accent }}>
                              {m.nombre || "—"}
                            </p>
                            <p className="text-xs font-semibold text-slate-500">
                              {m.especie} • {m.raza || "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navegación y Acciones del Formulario */}
          <div className="flex items-center justify-between p-5 bg-slate-50 border-t border-slate-100">
            <div>
              {step > 1 && (
                <button 
                  type="button" 
                  onClick={goBack}
                  className="btn-action-secondary">
                  <ArrowLeft size={15} weight="bold" />
                  <span>Atrás</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 hidden sm:block">
                Paso {step} de {STEPS.length}
              </span>

              {step < 3 ? (
                <button 
                  type="button" 
                  onClick={goNext}
                  className="btn-action-create">
                  <span>Continuar</span>
                  <ArrowRight size={15} weight="bold" />
                </button>
              ) : (
                /* Botón Verde Esmeralda (btn-action-nav) Código Consistente de Confirmación Final */
                <button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="btn-action-nav">
                  {loading ? (
                    <>
                      <Spinner size="sm" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} weight="bold" />
                      <span>Confirmar y Registrar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
