import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { 
  Users, MagnifyingGlass, Phone, Envelope, Cat, Dog, Bird, PawPrint,
  ArrowRight, WarningCircle, Plus, CaretLeft, CaretRight, FolderUser
} from "@phosphor-icons/react";

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

const ITEMS_PER_PAGE = 6;

export default function PacientesPage() {
  const [clientes,     setClientes]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [currentPage,  setCurrentPage]  = useState(1);

  const loadClientes = async () => {
    try {
      setLoading(true); 
      setError("");
      const res = await api.get("/clientes");
      
      // Filtrar limpiamente cualquier dato residual con etiquetas de prueba
      const clientesLimpios = (res.data || []).filter(c => 
        !c.nombre.toLowerCase().includes("prueba") &&
        !c.correo.toLowerCase().includes("test_") &&
        !c.correo.toLowerCase().includes("example.com")
      );
      
      setClientes(clientesLimpios);
    } catch (err) {
      setError(err.response?.data?.message || "Error al obtener el listado de pacientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClientes(); }, []);

  // Reiniciar a página 1 al buscar
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.cedula && c.cedula.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.telefono.includes(searchQuery) ||
    c.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mascotas.some(m => m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || m.especie.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Cálculo de Paginación
  const totalPages = Math.ceil(filteredClientes.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClientes = filteredClientes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

        <Link to="/registrar" className="btn-action-create">
          <Plus size={16} weight="bold" />
          <span>Nuevo Registro</span>
        </Link>
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
              Mostrando {filteredClientes.length} {filteredClientes.length === 1 ? 'propietario' : 'propietarios'}
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
          {/* Grid de Expedientes de Clientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedClientes.map(c => (
              <div 
                key={c.id} 
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4">

                {/* Propietario info sin etiqueta repetida sobrante */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold">
                    <Users size={20} weight="fill" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-base text-slate-900 leading-tight truncate">
                      {c.nombre}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {c.cedula ? `C.C. ${c.cedula}` : 'Titular del Expediente'}
                    </p>
                  </div>
                </div>

                {/* Datos de Contacto con Tooltip en Hover para Correos Truncados */}
                <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Phone size={14} className="text-sky-600 flex-shrink-0" />
                    <span className="truncate">{c.telefono}</span>
                  </p>

                  {/* Tooltip Nativo con title={c.correo} */}
                  <p 
                    title={`Correo de contacto: ${c.correo}`} 
                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-help">
                    <Envelope size={14} className="text-sky-600 flex-shrink-0" />
                    <span className="truncate max-w-[210px] text-slate-700 hover:text-sky-700 transition-colors">
                      {c.correo}
                    </span>
                  </p>
                </div>

                {/* Chips de Mascotas Codificados por Especie */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Cat size={13} className="text-slate-400" />
                      Mascotas Asignadas ({c.mascotas.length})
                    </span>
                  </div>

                  {c.mascotas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Sin mascotas registradas aún.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {c.mascotas.map(m => {
                        const badge = getEspecieBadge(m.especie);
                        return (
                          <Link 
                            key={m.id} 
                            to={`/mascotas/${m.id}`}
                            title={`Ver ficha clínica de ${m.nombre}`}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-extrabold transition-all hover:scale-[1.02] active:scale-95 shadow-2xs ${badge.bg}`}>
                            <span>{badge.icon}</span>
                            <span>{m.nombre}</span>
                            <ArrowRight size={11} weight="bold" className="ml-0.5 opacity-70" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Paginador Sobrio cuando hay más de una página */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 flex-wrap gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Página {currentPage} de {totalPages} ({filteredClientes.length} clientes en total)
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

    </div>
  );
}
