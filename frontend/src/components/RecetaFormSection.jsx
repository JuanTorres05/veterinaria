import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash, Prescription } from '@phosphor-icons/react';

export default function RecetaFormSection({
  recetaMeds,
  setRecetaMeds,
  indicacionesReceta,
  setIndicacionesReceta,
  variant = 'dark',
}) {
  const [catalogo, setCatalogo] = useState([]);
  const isLight = variant === 'light';

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

  const containerCls = isLight
    ? 'rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4'
    : 'rounded-xl border border-slate-700 bg-slate-900/70 p-4 space-y-3';

  const titleCls = isLight
    ? 'text-xs font-extrabold uppercase tracking-wider text-slate-700'
    : 'text-xs font-bold uppercase tracking-wider text-slate-200';

  const addBtnCls = isLight
    ? 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-40'
    : 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition-colors disabled:opacity-40';

  const cardCls = isLight
    ? 'p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3'
    : 'p-3 rounded-xl border border-slate-700/80 bg-slate-950/60 space-y-2.5';

  const inputCls = isLight
    ? 'h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-800 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all'
    : 'h-9 px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500';

  return (
    <div className={containerCls}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            <Prescription size={17} weight="bold" />
          </div>
          <div>
            <span className={titleCls}>
              Receta Médica / Medicamentos (Opcional)
            </span>
            {isLight && (
              <p className="text-[11px] text-slate-500">
                Selecciona medicamentos del catálogo y especifica dosis, frecuencia y duración.
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={agregarFila}
          disabled={catalogo.length === 0}
          className={addBtnCls}
        >
          <Plus size={14} weight="bold" />
          <span>Agregar medicamento</span>
        </button>
      </div>

      {recetaMeds.length === 0 ? (
        <div
          className={
            isLight
              ? 'rounded-xl border border-dashed border-slate-300 bg-white/80 p-6 text-center'
              : ''
          }
        >
          <p className={isLight ? 'text-xs text-slate-500' : 'text-[11px] text-slate-400'}>
            Si deseas emitir una receta estructurada para el historial del paciente, haz clic en &quot;Agregar medicamento&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recetaMeds.map((row, idx) => (
            <div key={idx} className={cardCls}>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Medicamento #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarFila(idx)}
                  className={`text-xs font-semibold inline-flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                    isLight
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <Trash size={14} />
                  <span>Quitar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={row.id_medicamento}
                  onChange={(e) => actualizarFila(idx, 'id_medicamento', e.target.value)}
                  className={inputCls}
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
                  className={inputCls}
                />

                <input
                  type="text"
                  value={row.frecuencia}
                  onChange={(e) => actualizarFila(idx, 'frecuencia', e.target.value)}
                  placeholder="Frecuencia (ej. Cada 12 horas)"
                  className={inputCls}
                />

                <input
                  type="text"
                  value={row.duracion}
                  onChange={(e) => actualizarFila(idx, 'duracion', e.target.value)}
                  placeholder="Duración (ej. 7 días)"
                  className={inputCls}
                />
              </div>

              <input
                type="text"
                value={row.instrucciones}
                onChange={(e) => actualizarFila(idx, 'instrucciones', e.target.value)}
                placeholder="Instrucciones específicas (ej. Administrar después de alimento)"
                className={`w-full ${inputCls}`}
              />
            </div>
          ))}

          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Indicaciones generales de la receta
            </label>
            <input
              type="text"
              value={indicacionesReceta}
              onChange={(e) => setIndicacionesReceta(e.target.value)}
              placeholder="Ej. Administrar según horario indicado y completar esquema."
              className={`w-full ${inputCls}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
