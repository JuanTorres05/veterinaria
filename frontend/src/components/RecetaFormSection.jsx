import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash, Prescription } from '@phosphor-icons/react';

export default function RecetaFormSection({
  recetaMeds,
  setRecetaMeds,
  indicacionesReceta,
  setIndicacionesReceta,
}) {
  const [catalogo, setCatalogo] = useState([]);

  useEffect(() => {
    let active = true;
    api
      .get('/mascotas/medicamentos')
      .then((res) => {
        if (active) setCatalogo(res.data || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const agregarFila = () => {
    const defaultId = catalogo[0]?.id ? String(catalogo[0].id) : '';
    setRecetaMeds((prev) => [
      ...prev,
      {
        id_medicamento: defaultId,
        dosis: '',
        frecuencia: '',
        duracion: '',
        instrucciones: '',
      },
    ]);
  };

  const actualizarFila = (idx, field, value) => {
    setRecetaMeds((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const eliminarFila = (idx) => {
    setRecetaMeds((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Prescription size={16} weight="bold" className="text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Receta Médica / Medicamentos (Opcional)
          </span>
        </div>
        <button
          type="button"
          onClick={agregarFila}
          disabled={catalogo.length === 0}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition-colors disabled:opacity-40"
        >
          <Plus size={13} weight="bold" />
          <span>Agregar medicamento</span>
        </button>
      </div>

      {recetaMeds.length === 0 ? (
        <p className="text-[11px] text-slate-400">
          Si deseas emitir una receta estructurada para el historial del paciente, haz clic en &quot;Agregar medicamento&quot;.
        </p>
      ) : (
        <div className="space-y-3">
          {recetaMeds.map((row, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-700/80 bg-slate-950/60 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Medicamento #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarFila(idx)}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold inline-flex items-center gap-1"
                >
                  <Trash size={13} />
                  <span>Quitar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={row.id_medicamento}
                  onChange={(e) => actualizarFila(idx, 'id_medicamento', e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {catalogo.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}{m.presentacion ? ` (${m.presentacion})` : ''}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={row.dosis}
                  onChange={(e) => actualizarFila(idx, 'dosis', e.target.value)}
                  placeholder="Dosis * (ej. 1 tableta / 5 ml)"
                  className="h-9 px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />

                <input
                  type="text"
                  value={row.frecuencia}
                  onChange={(e) => actualizarFila(idx, 'frecuencia', e.target.value)}
                  placeholder="Frecuencia (ej. Cada 12 horas)"
                  className="h-9 px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />

                <input
                  type="text"
                  value={row.duracion}
                  onChange={(e) => actualizarFila(idx, 'duracion', e.target.value)}
                  placeholder="Duración (ej. 7 días)"
                  className="h-9 px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <input
                type="text"
                value={row.instrucciones}
                onChange={(e) => actualizarFila(idx, 'instrucciones', e.target.value)}
                placeholder="Instrucciones específicas (ej. Administrar después de alimento)"
                className="w-full h-9 px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Indicaciones generales de la receta
            </label>
            <input
              type="text"
              value={indicacionesReceta}
              onChange={(e) => setIndicacionesReceta(e.target.value)}
              placeholder="Ej. Administrar según horario indicado y completar esquema."
              className="w-full h-9 px-3 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
