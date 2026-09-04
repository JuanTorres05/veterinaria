import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Spinner from "../components/Spinner";
import { 
  IdentificationCard, 
  Lock, 
  Eye, 
  EyeSlash, 
  ArrowRight, 
  PawPrint, 
  Key, 
  X, 
  CheckCircle, 
  EnvelopeSimple,
  ShieldCheck
} from "@phosphor-icons/react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ cedula: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Estado del modal de recuperación de contraseña
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotCedula, setForgotCedula] = useState("");
  const [forgotCorreo, setForgotCorreo] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  function validate() {
    const e = {};
    if (!form.cedula.trim()) e.cedula = "La cédula es obligatoria.";
    if (form.password.length < 6) e.password = "Mínimo 6 caracteres.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setLoading(true);
    setApiError("");
    setErrors({});
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      if (data.user.rol === "recepcionista") {
        navigate("/registrar", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setApiError("Cédula o contraseña incorrectos.");
      else if (status === 400) setApiError("Por favor verifica los datos ingresados.");
      else setApiError("Error de conexión con el servidor de la clínica.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotCedula.trim()) {
      setForgotError("Por favor ingresa tu cédula.");
      return;
    }
    if (!forgotCorreo.trim() || !forgotCorreo.includes("@")) {
      setForgotError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setForgotLoading(true);
    try {
      const { data } = await api.post("/auth/recuperar-password", {
        cedula: forgotCedula.trim(),
        correo: forgotCorreo.trim().toLowerCase(),
      });
      setForgotSuccess(data.message || "Solicitud de recuperación registrada exitosamente.");
    } catch (err) {
      const msg = err.response?.data?.message || "No se encontró una cuenta activa con los datos proporcionados.";
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  }

  // Helper para auto-completar cuenta demo en 1 clic
  function autofillDemo(cedula) {
    setForm({ cedula, password: "test1234" });
    setErrors({});
    setApiError("");
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between items-center p-4 sm:p-6 md:p-10 relative overflow-hidden antialiased select-none"
      style={{ 
        backgroundColor: "#F1F5F9", 
        color: "#0F172A",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>

      {/* Sutil iluminación ambiental de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-30"
        style={{ 
          background: "radial-gradient(circle, rgba(14, 116, 144, 0.12) 0%, rgba(241, 245, 249, 0) 70%)", 
          filter: "blur(100px)" 
        }} />

      {/* Grid de puntos claro sobrio */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ 
          backgroundImage: "radial-gradient(#0F172A 1px, transparent 1px)", 
          backgroundSize: "24px 24px" 
        }} />

      {/* Marcas de Agua Decorativas: Huellas de Mascotas Llamativas con Color Cyan/Sky/Teal de la Marca (Opacidad 22-28%) */}
      <div className="absolute top-8 left-10 pointer-events-none opacity-[0.26] text-cyan-600 rotate-[-18deg]">
        <PawPrint size={150} weight="fill" />
      </div>
      <div className="absolute top-20 right-14 pointer-events-none opacity-[0.24] text-sky-600 rotate-[22deg]">
        <PawPrint size={190} weight="fill" />
      </div>
      <div className="absolute bottom-12 left-16 pointer-events-none opacity-[0.25] text-cyan-600 rotate-[12deg]">
        <PawPrint size={170} weight="fill" />
      </div>
      <div className="absolute bottom-20 right-16 pointer-events-none opacity-[0.28] text-sky-600 rotate-[-25deg]">
        <PawPrint size={150} weight="fill" />
      </div>
      <div className="absolute top-1/2 left-6 -translate-y-1/2 pointer-events-none opacity-[0.22] text-teal-600 rotate-[35deg]">
        <PawPrint size={110} weight="fill" />
      </div>
      <div className="absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none opacity-[0.22] text-cyan-600 rotate-[-40deg]">
        <PawPrint size={120} weight="fill" />
      </div>
      <div className="absolute top-1/3 right-1/4 pointer-events-none opacity-[0.18] text-sky-600 rotate-[-10deg]">
        <PawPrint size={85} weight="fill" />
      </div>
      <div className="absolute bottom-1/3 left-1/4 pointer-events-none opacity-[0.18] text-teal-600 rotate-[15deg]">
        <PawPrint size={95} weight="fill" />
      </div>

      {/* Header superior minimalista claro */}
      <header className="w-full max-w-md flex justify-between items-center relative z-10 pt-2 pb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">
            Sistema Activo v2.1
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          DataVet Clinical
        </span>
      </header>

      {/* Contenedor principal centrado — Tarjeta de Formulario Oscura Elegante */}
      <main className="w-full max-w-[440px] relative z-10 my-auto">
        
        {/* Envoltorio Exterior (Outer Bezel Oscuro) */}
        <div className="p-2.5 rounded-[2.2rem] bg-slate-900/90 border border-slate-800 shadow-2xl shadow-slate-900/25 backdrop-blur-xl transition-all">
          
          {/* Tarjeta Interior Concéntrica (Inner Core Oscuro) */}
          <div className="rounded-[calc(2.2rem-0.625rem)] bg-slate-950 border border-slate-800/80 p-6 sm:p-8 shadow-inner text-slate-100">
            
            {/* Identidad de marca sobria */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center mb-4 shadow-lg shadow-black/50">
                <PawPrint size={28} weight="fill" className="text-cyan-400" />
              </div>
              
              <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">
                DataVet
              </h1>
              
              <p className="text-xs text-slate-400 font-medium">
                Gestión Clínica & Médica Veterinaria
              </p>
            </div>

            {/* Banner de error de API */}
            {apiError && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs mb-6 animate-fade-in">
                <span className="text-base leading-none">⚠️</span>
                <span className="font-medium flex-1">{apiError}</span>
              </div>
            )}

            {/* Formulario de Login Oscuro */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              
              {/* Campo Cédula */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2" htmlFor="cedula">
                  Cédula de Identificación
                </label>
                <div className="relative">
                  <IdentificationCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="cedula" 
                    type="text" 
                    autoComplete="username" 
                    placeholder="Ej. 0000000001"
                    value={form.cedula}
                    onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                    className={`w-full h-11 pl-10 pr-4 text-sm rounded-xl bg-slate-900 border text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium ${
                      errors.cedula ? "border-rose-500/80 bg-rose-950/20" : "border-slate-800"
                    }`}
                  />
                </div>
                {errors.cedula && (
                  <p className="text-[11px] font-medium text-rose-400 mt-1.5 flex items-center gap-1">
                    <span>▲</span>{errors.cedula}
                  </p>
                )}
              </div>

              {/* Campo Contraseña */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400" htmlFor="password">
                    Contraseña
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password" 
                    type={showPass ? "text" : "password"} 
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`w-full h-11 pl-10 pr-11 text-sm rounded-xl bg-slate-900 border text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium ${
                      errors.password ? "border-rose-500/80 bg-rose-950/20" : "border-slate-800"
                    }`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)} 
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] font-medium text-rose-400 mt-1.5 flex items-center gap-1">
                    <span>▲</span>{errors.password}
                  </p>
                )}
              </div>

              {/* Botón principal de acceso */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white flex items-center justify-between px-5 shadow-lg shadow-cyan-950/40 active:scale-[0.99] transition-all disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center gap-2 mx-auto">
                    <Spinner size="sm" /> Verificando acceso...
                  </span>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                      <ArrowRight size={14} weight="bold" />
                    </div>
                  </>
                )}
              </button>
            </form>

            {/* Accesos de Prueba Rápidos (1-Clic AutoFill) */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  <span>Accesos de Prueba (1-Clic)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Clave: test1234
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Admin", cedula: "0000000001", roleColor: "hover:border-cyan-500/50 hover:bg-cyan-950/30" },
                  { label: "Veterinario", cedula: "0000000002", roleColor: "hover:border-emerald-500/50 hover:bg-emerald-950/30" },
                  { label: "Recepción", cedula: "0000000003", roleColor: "hover:border-amber-500/50 hover:bg-amber-950/30" },
                ].map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => autofillDemo(demo.cedula)}
                    className={`py-2 px-2 rounded-xl bg-slate-900 border border-slate-800 text-center transition-all group ${demo.roleColor}`}
                    title={`Cargar credenciales de ${demo.label}`}>
                    <p className="text-[11px] font-semibold text-slate-300 group-hover:text-white">
                      {demo.label}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono truncate">
                      {demo.cedula}
                    </p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer inferior sobrio */}
      <footer className="w-full max-w-md text-center relative z-10 pt-6 pb-2 text-[11px] text-slate-500 font-medium">
        DataVet System &copy; 2026 &middot; Todos los derechos reservados
      </footer>

      {/* Modal: Recuperación de Contraseña Oscuro Concentrado */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-[2.2rem] bg-slate-900 border border-slate-800 p-6 sm:p-8 relative shadow-2xl text-slate-100">
            
            {/* Botón cerrar */}
            <button 
              onClick={() => { setShowForgotModal(false); setForgotError(""); setForgotSuccess(""); }}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>

            {/* Header modal */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center">
                <Key size={22} weight="bold" className="text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Recuperar Contraseña
                </h3>
                <p className="text-xs text-slate-400">
                  Solicita el restablecimiento de tu clave de acceso
                </p>
              </div>
            </div>

            {/* Estado de éxito */}
            {forgotSuccess ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs flex items-start gap-3">
                  <CheckCircle size={20} weight="fill" className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">¡Solicitud recibida!</p>
                    <p className="leading-relaxed text-emerald-200/90">{forgotSuccess}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowForgotModal(false); setForgotError(""); setForgotSuccess(""); }}
                  className="w-full h-11 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-all">
                  Entendido, volver al inicio
                </button>
              </div>
            ) : (
              /* Formulario modal */
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotError && (
                  <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="forgot-cedula">
                    Cédula de Identidad *
                  </label>
                  <div className="relative">
                    <IdentificationCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      id="forgot-cedula" 
                      type="text" 
                      placeholder="Ej. 0000000001"
                      value={forgotCedula} 
                      onChange={(e) => setForgotCedula(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="forgot-correo">
                    Correo Electrónico Registrado *
                  </label>
                  <div className="relative">
                    <EnvelopeSimple size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      id="forgot-correo" 
                      type="email" 
                      placeholder="Ej. usuario@clinica.com"
                      value={forgotCorreo} 
                      onChange={(e) => setForgotCorreo(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all" 
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button 
                    type="button" 
                    onClick={() => { setShowForgotModal(false); setForgotError(""); setForgotSuccess(""); }}
                    className="flex-1 h-11 rounded-xl font-semibold text-xs border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all">
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={forgotLoading}
                    className="flex-1 h-11 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition-all disabled:opacity-50">
                    {forgotLoading ? "Enviando..." : "Enviar Solicitud"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
