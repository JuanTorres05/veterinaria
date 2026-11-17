import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { resolveArchivoUrl } from "../utils/archivos";
import PetPhotoPicker from "../components/PetPhotoPicker";
import { 
  Users, MagnifyingGlass, Phone, Envelope, Cat, PawPrint,
  ArrowRight, WarningCircle, Plus, CaretLeft, CaretRight, FolderUser, X,
  CheckCircle, Eye, FirstAid, Scales, CalendarBlank
} from "@phosphor-icons/react";

function calcularEdad(fechaNac) {
  if (!fechaNac) return "No registrada";
  const hoy = new Date();
  const nac = new Date(fechaNac);
  if (isNaN(nac.getTime())) return "No registrada";
  let meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
  if (hoy.getDate() < nac.getDate()) meses--;
  if (meses < 1) return "Recién nacido";
  if (meses < 12) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  return `${anios} ${anios === 1 ? "año" : "años"}`;
}

function getEstadoClinico(m) {
  if (m.hospitalizado) {
    return {
      label: "Hospitalizado",
      cls: "bg-sky-100/95 text-sky-900 border-sky-200",
      icon: FirstAid,
    };
  }
  if (m.enSeguimiento) {
    return {
      label: "En seguimiento",
      cls: "bg-amber-100/95 text-amber-900 border-amber-200",
      icon: Eye,
    };
  }
  return {
    label: "Saludable",
    cls: "bg-emerald-100/95 text-emerald-900 border-emerald-200",
    icon: CheckCircle,
  };
}

/* Sistema de Chips por Especie de Mascota con Significados de Color */
function getEspecieBadge(especie) {
  const e = (especie || "").toLowerCase();
  if (e.includes("perro") || e.includes("canino")) {
    return { bg: "bg-sky-50 text-sky-800 border-sky-200", icon: "🐕", label: "Perro" };
  }
  if (e.includes("gato") || e.includes("felino")) {
    return { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: "🐈", label: "Gato" };
  }
  if (e.includes("ave") || e.includes("loro") || e.includes("pájaro")) {
    return { bg: "bg-amber-50 text-amber-800 border-amber-200", icon: "🦜", label: "Ave" };
  }
  if (e.includes("conejo")) {
    return { bg: "bg-purple-50 text-purple-800 border-purple-200", icon: "🐇", label: "Conejo" };
  }
  return { bg: "bg-indigo-50 text-indigo-800 border-indigo-200", icon: "🐾", label: especie || "Mascota" };
}

const ITEMS_PER_PAGE = 12;

export default function PacientesPage() {
  const { user } = useAuth();
  const canRegister = user?.rol === "admin" || user?.rol === "recepcionista";
  const [clientes,     setClientes]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [currentPage,  setCurrentPage]  = useState(1);

  // Modal para agregar mascota a cliente existente
  const [clienteModal, setClienteModal] = useState(null);
  const [savingMascota, setSavingMascota] = useState(false);
  const [modalError, setModalError] = useState("");
  const [formMascota, setFormMascota] = useState({
    nombre: "",
    especie: "Perro",
    raza: "",
    sexo: "Desconocido",
    fechaNacimiento: "",
    pesoKg: "",
    color: "",
    foto: null,
  });

  const abrirModalMascota = (cliente) => {
    setClienteModal(cliente);
    setModalError("");
    setFormMascota({
      nombre: "",
      especie: "Perro",
      raza: "",
      sexo: "Desconocido",
      fechaNacimiento: "",
      pesoKg: "",
      color: "",
      foto: null,
    });
  };

  const handleAgregarMascota = async (e) => {
    e.preventDefault();
    if (!clienteModal) return;
    setModalError("");
    try {
      setSavingMascota(true);
      await api.post(`/clientes/${clienteModal.id}/mascotas`, {
        nombre: formMascota.nombre.trim(),
        especie: formMascota.especie.trim(),
        raza: formMascota.raza.trim(),
        sexo: formMascota.sexo,
        fechaNacimiento: formMascota.fechaNacimiento || null,
        pesoKg: formMascota.pesoKg ? Number(formMascota.pesoKg) : null,
        color: formMascota.color.trim() || null,
        foto: formMascota.foto || null,
      });
      setClienteModal(null);
      await loadClientes();
    } catch (err) {
      setModalError(err.response?.data?.message || "No se pudo registrar la mascota.");
    } finally {
      setSavingMascota(false);
    }
  };

  const loadClientes = async () => {
    try {
      setLoading(true); 
      setError("");
      const res = await api.get("/clientes");
      setClientes(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Error al obtener el listado de pacientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClientes(); }, []);

  // Reiniciar a página 1 al buscar
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const filteredClientes = clientes.filter(c => {
    const q = searchQuery.toLowerCase();
    const nombre = (c.nombre || "").toLowerCase();
    const cedula = String(c.cedula || "").toLowerCase();
    const telefono = String(c.telefono || "").toLowerCase();
    const correo = (c.correo || "").toLowerCase();
    const mascotasMatch = (c.mascotas || []).some(m => 
      (m.nombre || "").toLowerCase().includes(q) || 
      (m.especie || "").toLowerCase().includes(q)
    );
    return nombre.includes(q) || cedula.includes(q) || telefono.includes(q) || correo.includes(q) || mascotasMatch;
  });

  // Aplanar a fichas individuales de pacientes (mascota + propietario integrado)
  const fichasPacientes = filteredClientes.flatMap((c) => {
    const q = searchQuery.toLowerCase();
    const ownerMatches =
      (c.nombre || "").toLowerCase().includes(q) ||
      String(c.cedula || "").toLowerCase().includes(q) ||
      String(c.telefono || "").toLowerCase().includes(q) ||
      (c.correo || "").toLowerCase().includes(q);

    const mascotasVisibles = !q || ownerMatches
      ? c.mascotas || []
      : (c.mascotas || []).filter(
          (m) =>
            (m.nombre || "").toLowerCase().includes(q) ||
            (m.especie || "").toLowerCase().includes(q) ||
            (m.raza || "").toLowerCase().includes(q)
        );

    if (mascotasVisibles.length === 0 && (c.mascotas || []).length === 0) {
      return [{ tipo: "sin_mascota", cliente: c, key: `c-${c.id}` }];
    }
    return mascotasVisibles.map((m) => ({
      tipo: "mascota",
      cliente: c,
      mascota: m,
      key: `m-${m.id}`,
    }));
  });

  // Cálculo de Paginación
  const totalPages = Math.ceil(fichasPacientes.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFichas = fichasPacientes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in pb-6">

      {/* Cabecera Principal (Estilo Unificado con Agenda/Monitoreo) */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 shadow-xs">
            <FolderUser size={22} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Expedientes & Clientes
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Directorio clínico de propietarios y sus mascotas asociadas
            </p>
          </div>
        </div>

        {canRegister && (
          <Link to="/registrar" className="btn-action-create">
            <Plus size={16} weight="bold" />
            <span>Nuevo Registro</span>
          </Link>
        )}
      </div>

      {/* Buscador Local Diferenciado Visualmente del Buscador Global del Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <MagnifyingGlass size={16} className="text-sky-600" />
            Filtro de Expedientes Locales
          </label>
          
          {!loading && !error && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
              Mostrando {fichasPacientes.length} {fichasPacientes.length === 1 ? 'paciente' : 'pacientes'}
            </span>
          )}
        </div>

        <div className="relative">
          <MagnifyingGlass size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cédula, cliente, teléfono, correo o nombre/especie de mascota..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-sky-600 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm font-semibold">
          <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton Loader */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(k => (
            <div key={k} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredClientes.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center text-3xl mb-4">
            👥
          </div>
          <h3 className="font-bold text-lg text-slate-900">
            {searchQuery ? "Sin coincidencias en el directorio" : "Sin clientes registrados"}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            {searchQuery
              ? `No encontramos registros para "${searchQuery}". Intenta con otro nombre, mascota o teléfono.`
              : "Comienza registrando al primer propietario y su mascota en el sistema."}
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="btn-action-secondary mt-4">
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grid Unificado de Fichas de Pacientes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedFichas.map((item) => {
              const c = item.cliente;
              if (item.tipo === "sin_mascota") {
                return (
                  <div
                    key={item.key}
                    className="bg-white border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        Sin mascota registrada
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900">{c.nombre}</h3>
                      <p className="text-[11px] text-slate-500">
                        {c.cedula ? `C.C. ${c.cedula}` : ""}
                        {c.telefono ? ` • ${c.telefono}` : ""}
                      </p>
                    </div>
                    {canRegister && (
                      <button
                        type="button"
                        onClick={() => abrirModalMascota(c)}
                        className="w-full py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus size={14} weight="bold" />
                        <span>Agregar Mascota</span>
                      </button>
                    )}
                  </div>
                );
              }

              const m = item.mascota;
              const badge = getEspecieBadge(m.especie);
              const estado = getEstadoClinico(m);
              const EstadoIcon = estado.icon;
              const esMacho = m.sexo === "Macho";
              const esHembra = m.sexo === "Hembra";

              return (
                <div
                  key={item.key}
                  className="group bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                >
                  <Link to={`/mascotas/${m.id}`} className="flex flex-col gap-3">
                    {/* Foto con badge de estado superpuesto */}
                    <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                      {m.fotoUrl ? (
                        <img
                          src={resolveArchivoUrl(m.fotoUrl)}
                          alt={m.nombre}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-5xl select-none">{badge.icon}</span>
                      )}

                      <span
                        className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs backdrop-blur-xs ${estado.cls}`}
                      >
                        <EstadoIcon size={12} weight="fill" />
                        <span>{estado.label}</span>
                      </span>
                    </div>

                    {/* Datos de la mascota */}
                    <div className="px-0.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5 truncate">
                          <span className="truncate">{m.nombre}</span>
                          {esMacho && <span className="text-sky-600 font-bold">♂</span>}
                          {esHembra && <span className="text-rose-500 font-bold">♀</span>}
                        </h3>
                        <ArrowRight size={14} weight="bold" className="text-slate-300 group-hover:text-sky-600 transition-colors flex-shrink-0" />
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 font-medium">
                        <p className="flex items-center gap-2 truncate">
                          <PawPrint size={13} weight="fill" className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">
                            {m.especie}{m.raza ? ` - ${m.raza}` : ""}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <CalendarBlank size={13} weight="fill" className="text-slate-400 flex-shrink-0" />
                          <span>Edad: {calcularEdad(m.fechaNacimiento)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Scales size={13} weight="fill" className="text-slate-400 flex-shrink-0" />
                          <span>Peso: {m.pesoKg != null ? `${m.pesoKg} kg` : "No registrado"}</span>
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Información del propietario integrada dentro de la ficha */}
                  <div className="pt-2.5 border-t border-slate-100 px-0.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                        <Users size={13} className="text-sky-600 flex-shrink-0" />
                        <span className="truncate">{c.nombre}</span>
                      </p>
                      {canRegister && (
                        <button
                          type="button"
                          onClick={() => abrirModalMascota(c)}
                          title={`Agregar otra mascota a ${c.nombre}`}
                          className="text-[10px] font-bold text-sky-700 hover:text-sky-800 hover:bg-sky-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 flex-shrink-0 transition-colors"
                        >
                          <Plus size={11} weight="bold" />
                          <span>Mascota</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="truncate">{c.cedula ? `C.C. ${c.cedula}` : "Titular"}</span>
                      {c.telefono && (
                        <span className="inline-flex items-center gap-1 flex-shrink-0">
                          <Phone size={11} className="text-slate-400" />
                          {c.telefono}
                        </span>
                      )}
                    </div>
                    {c.correo && (
                      <p
                        title={c.correo}
                        className="text-[11px] text-slate-400 flex items-center gap-1 truncate"
                      >
                        <Envelope size={11} className="flex-shrink-0" />
                        <span className="truncate">{c.correo}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginador Sobrio cuando hay más de una página */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 flex-wrap gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Página {currentPage} de {totalPages} ({fichasPacientes.length} pacientes en total)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all flex items-center gap-1">
                  <CaretLeft size={14} weight="bold" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}>
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all flex items-center gap-1">
                  <span>Siguiente</span>
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Agregar nueva mascota a cliente existente */}
      {clienteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Agregar Mascota a {clienteModal.nombre}
                </h2>
                <p className="text-xs text-slate-500">
                  C.C. {clienteModal.cedula} • Se abrirá su historia clínica automáticamente
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClienteModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleAgregarMascota} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <WarningCircle size={16} weight="bold" className="text-rose-600 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Nombre de la mascota *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={formMascota.nombre}
                    onChange={(e) => setFormMascota((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej. Toby"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Especie *
                  </label>
                  <select
                    value={formMascota.especie}
                    onChange={(e) => setFormMascota((f) => ({ ...f, especie: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-sky-600"
                  >
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Conejo">Conejo</option>
                    <option value="Ave">Ave</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Raza *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={formMascota.raza}
                    onChange={(e) => setFormMascota((f) => ({ ...f, raza: e.target.value }))}
                    placeholder="Ej. Criollo"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Sexo
                  </label>
                  <select
                    value={formMascota.sexo}
                    onChange={(e) => setFormMascota((f) => ({ ...f, sexo: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-sky-600"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                    <option value="Desconocido">Desconocido</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={formMascota.fechaNacimiento}
                    onChange={(e) => setFormMascota((f) => ({ ...f, fechaNacimiento: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="300"
                    value={formMascota.pesoKg}
                    onChange={(e) => setFormMascota((f) => ({ ...f, pesoKg: e.target.value }))}
                    placeholder="Ej. 12.5"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Color / Señas particulares
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={formMascota.color}
                  onChange={(e) => setFormMascota((f) => ({ ...f, color: e.target.value }))}
                  placeholder="Ej. Blanco con manchas café"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-600"
                />
              </div>

              <PetPhotoPicker
                value={formMascota.foto}
                onChange={(foto) => setFormMascota((f) => ({ ...f, foto }))}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClienteModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMascota}
                  className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  {savingMascota ? "Guardando..." : "Registrar Mascota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
