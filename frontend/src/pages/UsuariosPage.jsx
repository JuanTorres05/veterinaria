import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Spinner from "../components/Spinner";
import { 
  UsersThree, Plus, Key, ShieldCheck, Stethoscope, ClipboardText, 
  MagnifyingGlass, CheckCircle, WarningCircle, X, Check, LockKey
} from "@phosphor-icons/react";

const ROL_CONFIG = {
  admin:         { label: "Administrador", icon: ShieldCheck,   badge: "bg-purple-100 text-purple-800 border-purple-200" },
  veterinario:   { label: "Veterinario",   icon: Stethoscope,   badge: "bg-sky-100 text-sky-800 border-sky-200" },
  recepcionista: { label: "Recepción",     icon: ClipboardText, badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]+$/;
const cedulaRegex = /^[a-zA-Z0-9-]+$/;

export default function UsuariosPage() {
  const [usuarios,     setUsuarios]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [rolFiltro,    setRolFiltro]    = useState("");

  // Modales
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalPassOpen,   setModalPassOpen]   = useState(false);
  const [selectedUser,    setSelectedUser]    = useState(null);

  // Form Crear Usuario
  const [cedulaInput,   setCedulaInput]   = useState("");
  const [nombreInput,   setNombreInput]   = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [rolIdInput,    setRolIdInput]    = useState("3"); // Por defecto Veterinario (id 3 en BD)
  const [formError,     setFormError]     = useState("");
  const [guardando,     setGuardando]     = useState(false);

  // Form Cambiar Password
  const [newPasswordInput, setNewPasswordInput] = useState("");

  // Feedback Toast
  const [successMsg, setSuccessMsg] = useState("");

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar la lista de trabajadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsuarios(); }, [loadUsuarios]);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  }

  // 1. Crear nuevo trabajador
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const cedula = cedulaInput.trim();
    if (!cedula || cedula.length < 6) {
      return setFormError("Ingresa una cédula válida (mínimo 6 caracteres).");
    }
    if (!cedulaRegex.test(cedula)) {
      return setFormError("La cédula solo puede contener números, letras o guiones.");
    }
    const nombre = nombreInput.trim();
    if (!nombre || nombre.length < 3) {
      return setFormError("Ingresa el nombre completo (mínimo 3 caracteres).");
    }
    if (!nombreRegex.test(nombre)) {
      return setFormError("El nombre solo puede contener letras y espacios.");
    }
    if (!passwordInput || passwordInput.length < 6) {
      return setFormError("La contraseña debe tener al menos 6 caracteres.");
    }

    try {
      setGuardando(true);
      setFormError("");
      const res = await api.post("/usuarios", {
        cedula: cedulaInput.trim(),
        nombre: nombreInput.trim(),
        password: passwordInput,
        rol_id: Number(rolIdInput)
      });

      setModalCreateOpen(false);
      setCedulaInput("");
      setNombreInput("");
      setPasswordInput("");
      setRolIdInput("2");
      loadUsuarios();

      showSuccess(`¡Trabajador ${res.data.nombre} creado exitosamente en el sistema!`);
    } catch (err) {
      setFormError(err.response?.data?.message || "Error al registrar el trabajador.");
    } finally {
      setGuardando(false);
    }
  };

  // 2. Conmutar estado Activo / Inactivo
  const handleToggleEstado = async (u) => {
    const nuevoEstado = !u.activo;
    const accionText = nuevoEstado ? "activar" : "desactivar";
    if (!window.confirm(`¿Confirma que desea ${accionText} el acceso de ${u.nombre}?`)) return;

    try {
      await api.patch(`/usuarios/${u.id}/estado`, { activo: nuevoEstado });
      loadUsuarios();
      showSuccess(`Cuenta de ${u.nombre} ${nuevoEstado ? 'activada' : 'desactivada'} correctamente.`);
    } catch (err) {
      alert(err.response?.data?.message || "Error al actualizar estado.");
    }
  };

  // 3. Cambiar Contraseña de Trabajador
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      return setFormError("La nueva contraseña debe tener al menos 6 caracteres.");
    }

    try {
      setGuardando(true);
      setFormError("");
      await api.put(`/usuarios/${selectedUser.id}/password`, { password: newPasswordInput });
      
      setModalPassOpen(false);
      setSelectedUser(null);
      setNewPasswordInput("");
      showSuccess(`Contraseña de ${selectedUser.nombre} actualizada correctamente.`);
    } catch (err) {
      setFormError(err.response?.data?.message || "Error al actualizar la contraseña.");
    } finally {
      setGuardando(false);
    }
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const matchesSearch = 
      (u.nombre || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.cedula || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRol = rolFiltro === "" || u.rol === rolFiltro;
    return matchesSearch && matchesRol;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-6">

      {/* ── Cabecera Principal ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 shadow-xs">
            <UsersThree size={22} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Gestión de Personal & Usuarios
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Administración de cuentas de acceso, roles y asignación de contraseñas
            </p>
          </div>
        </div>

        <button 
          onClick={() => setModalCreateOpen(true)}
          className="btn-action-create">
          <Plus size={16} weight="bold" />
          <span>Registrar Nuevo Trabajador</span>
        </button>
      </div>

      {/* Toast Feedback de Éxito */}
      {successMsg && (
        <div className="animate-fade-in flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-extrabold shadow-xs">
          <CheckCircle size={18} weight="fill" className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Panel de Filtros ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <MagnifyingGlass size={16} className="text-sky-600" />
            Búsqueda de Trabajadores
          </label>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'cuenta' : 'cuentas'} en total
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o número de cédula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-sky-600 focus:bg-white transition-all"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-600">
              <option value="">-- Todos los Roles --</option>
              <option value="veterinario">Veterinarios</option>
              <option value="recepcionista">Recepcionistas</option>
              <option value="admin">Administradores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold">
          <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Tabla de Trabajadores / Cuentas de Usuario ── */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cargando trabajadores...</p>
        </div>
      ) : filteredUsuarios.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center text-2xl mx-auto mb-3">
            🛡️
          </div>
          <p className="font-bold text-base text-slate-900">Sin trabajadores encontrados</p>
          <p className="text-xs text-slate-500 mt-1">No hay coincidencias para los filtros aplicados.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Trabajador", "Cédula", "Rol Asignado", "Estado", "Acciones de Cuenta"].map((h) => (
                    <th key={h} className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsuarios.map((u) => {
                  const rolCfg = ROL_CONFIG[u.rol] || { label: u.rol, badge: "bg-slate-100 text-slate-700" };
                  const IconRol = rolCfg.icon || UsersThree;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      {/* Trabajador */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-slate-900 leading-none">{u.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">ID #{u.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Cédula */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-700">
                        {u.cedula}
                      </td>

                      {/* Rol */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${rolCfg.badge}`}>
                          <IconRol size={13} weight="fill" />
                          <span>{rolCfg.label}</span>
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {u.activo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ● Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                            ○ Inactivo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewPasswordInput("");
                              setFormError("");
                              setModalPassOpen(true);
                            }}
                            title="Cambiar contraseña de esta cuenta"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-bold transition-all text-xs active:scale-[0.97]">
                            <Key size={13} className="text-sky-600" />
                            <span>Contraseña</span>
                          </button>

                          <button
                            onClick={() => handleToggleEstado(u)}
                            className={`px-3 py-1.5 rounded-xl border font-bold transition-all text-xs active:scale-[0.97] ${
                              u.activo
                                ? "border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}>
                            {u.activo ? "Desactivar" : "Activar Cuenta"}
                          </button>
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

      {/* ── MODAL 1: REGISTRAR NUEVO TRABAJADOR ── */}
      {modalCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0F172A] text-slate-100 shadow-2xl overflow-hidden">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck size={18} weight="bold" />
                </div>
                <h2 className="font-extrabold text-base text-white tracking-tight">
                  Registrar Nuevo Trabajador
                </h2>
              </div>
              <button 
                onClick={() => setModalCreateOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all">
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs font-semibold">
                  <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Número de Cédula / Documento <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. 1098765432"
                  value={cedulaInput}
                  onChange={(e) => setCedulaInput(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nombre Completo del Trabajador <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Dr. Carlos Mario Restrepo"
                  value={nombreInput}
                  onChange={(e) => setNombreInput(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Rol de Acceso al Sistema <span className="text-rose-400">*</span>
                </label>
                <select
                  value={rolIdInput}
                  onChange={(e) => setRolIdInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-medium focus:outline-none focus:border-sky-500">
                  <option value="3">🩺 Veterinario (Atención Clínica y Diagnóstico)</option>
                  <option value="2">📋 Recepción (Agenda, Registros y Citas)</option>
                  <option value="1">🛡️ Administrador (Acceso Total y Métricas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Contraseña Inicial de Acceso <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCreateOpen(false)}
                  className="px-4 py-2.5 h-11 rounded-xl font-bold text-xs text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 transition-all">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="btn-action-create">
                  {guardando ? (
                    <>
                      <Spinner size="sm" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} weight="bold" />
                      <span>Crear Cuenta de Trabajador</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL 2: ASIGNAR NUEVA CONTRASEÑA ── */}
      {modalPassOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0F172A] text-slate-100 shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                  <LockKey size={18} weight="bold" />
                </div>
                <h2 className="font-extrabold text-base text-white tracking-tight">
                  Cambiar Contraseña
                </h2>
              </div>
              <button 
                onClick={() => setModalPassOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all">
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-300">
                Asignar una nueva contraseña de acceso para <strong className="text-white">{selectedUser.nombre}</strong> (Cédula: {selectedUser.cedula}):
              </p>

              {formError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs font-semibold">
                  <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nueva Contraseña <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Ingresa la nueva clave..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalPassOpen(false)}
                  className="px-4 py-2.5 h-11 rounded-xl font-bold text-xs text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 transition-all">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="btn-action-create">
                  {guardando ? (
                    <>
                      <Spinner size="sm" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} weight="bold" />
                      <span>Guardar Nueva Contraseña</span>
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
