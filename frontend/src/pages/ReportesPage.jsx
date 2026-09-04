import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  ChartBar,
  Users,
  Cat,
  CalendarBlank,
  Stethoscope,
  ClipboardText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowClockwise,
  Trophy,
  PawPrint,
  Check,
  WarningCircle
} from '@phosphor-icons/react';

/* ── 1. Componente Gráfico de Barras Rectangulares HTML/CSS (Proporcional y Sin Deformación) ── */
function StandardBarChart({ data, xKey, yKey, barColor = "bg-sky-600 hover:bg-sky-500", height = 220 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-xs font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
        Sin datos registrados para este período
      </div>
    );
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 1);

  return (
    <div className="space-y-2">
      {/* Contenedor de Barras con Altura Fija y Alineación Proporcional al Fondo */}
      <div 
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-end justify-around gap-2 overflow-x-auto"
        style={{ height: `${height}px` }}>
        {data.map((d, i) => {
          const val = Number(d[yKey]) || 0;
          // Porcentaje exacto respecto al valor máximo del período
          const heightPct = Math.round((val / maxVal) * 100);
          const xLabel = d[xKey] || '';

          return (
            <div 
              key={i} 
              className="flex-1 flex flex-col items-center justify-end h-full min-w-[36px] max-w-[56px] group relative">
              
              {/* Valor numérico superior sobre la barra */}
              <span className={`text-[11px] font-extrabold mb-1.5 transition-colors ${val > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                {val}
              </span>

              {/* Barra Rectangular Estándar (Sin cilindros ni distorsión) */}
              <div 
                className="w-full rounded-t-lg bg-slate-200 relative overflow-hidden flex items-end"
                style={{ height: '78%' }}>
                <div 
                  className={`w-full rounded-t-lg transition-all duration-500 ${barColor}`}
                  style={{ height: `${Math.max(heightPct, val > 0 ? 6 : 0)}%` }}
                />
              </div>

              {/* Tooltip en Hover con datos completos */}
              <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                {xLabel}: {val} {val === 1 ? 'cita' : 'citas'}
              </div>

              {/* Etiqueta del Eje X (Horizontal, legible y sin rotación) */}
              <span className="text-[11px] font-extrabold text-slate-600 mt-2 truncate w-full text-center tracking-tight">
                {xLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 2. Componente Donut Chart Semántico (Proporciones Exactas de Atendidas, Pendientes y Canceladas) ── */
function SemanticDonutChart({ pendientes = 0, atendidas = 0, canceladas = 0 }) {
  const total = pendientes + atendidas + canceladas;
  const r = 36;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;

  // Segmentos semánticos con colores oficiales DataVet
  const segments = [
    { key: 'pendientes', label: 'Pendientes', value: pendientes, color: '#D97706' }, // Amber-600
    { key: 'atendidas',  label: 'Atendidas',  value: atendidas,  color: '#059669' }, // Emerald-600
    { key: 'canceladas', label: 'Canceladas', value: canceladas, color: '#E11D48' }, // Rose-600
  ];

  let accumulatedPct = 0;
  const calculatedSegments = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const startPct = accumulatedPct;
    accumulatedPct += pct;
    return { ...seg, pct, startPct };
  });

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
        {/* Anillo de fondo */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        
        {/* Trazo de cada segmento semántico */}
        {calculatedSegments.map((seg) => {
          if (seg.pct <= 0) return null;
          const strokeDasharray = `${seg.pct * circumference} ${(1 - seg.pct) * circumference}`;
          const strokeDashoffset = -seg.startPct * circumference;

          return (
            <circle
              key={seg.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          );
        })}
      </svg>

      {/* Total en el centro del Donut */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-2xl font-extrabold text-slate-900 leading-none">
          {total}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
          Citas Totales
        </span>
      </div>
    </div>
  );
}

/* ── Componente Principal de Reportes ─────────────────────────────────────── */
export default function ReportesPage() {
  const [resumen,     setResumen]     = useState(null);
  const [citasDia,    setCitasDia]    = useState([]);
  const [citasSemana, setCitasSemana] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [diasFiltro,  setDiasFiltro]  = useState(30);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [r1, r2, r3] = await Promise.all([
        api.get('/reportes/resumen'),
        api.get(`/reportes/citas-por-dia?dias=${diasFiltro}`),
        api.get('/reportes/citas-por-dia-semana'),
      ]);
      
      setResumen(r1.data);

      // Formatear etiquetas legibles de fecha
      setCitasDia(
        r2.data.map((d) => {
          const parts = d.fecha.split('-');
          const fechaObj = parts.length === 3 
            ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
            : new Date(d.fecha);
            
          return {
            ...d,
            fechaLabel: fechaObj.toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'short',
            }),
          };
        })
      );

      setCitasSemana(r3.data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las métricas de reportes. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [diasFiltro]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statCards = resumen
    ? [
        { icon: Users,         label: 'Clientes Registrados', value: resumen.totalClientes, color: 'text-sky-600',     bg: 'bg-sky-50 border-sky-200' },
        { icon: Cat,           label: 'Mascotas Registradas', value: resumen.totalMascotas, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
        { icon: CalendarBlank, label: 'Citas Programadas',   value: resumen.totalCitas,    color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
        { icon: ClipboardText, label: 'Registros Clínicos',  value: resumen.totalHistorial,color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200' },
      ]
    : [];

  return (
    <div className="space-y-7 animate-fade-in pb-6">

      {/* ── Cabecera Principal ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 shadow-xs">
            <ChartBar size={22} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Reportes & Métricas
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Estadísticas consolidadas del sistema DataVet
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xs">
          <ArrowClockwise size={14} className={loading ? 'animate-spin text-sky-600' : 'text-slate-500'} />
          <span>Actualizar Métricas</span>
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm font-semibold">
          <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── KPI Cards Generales ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Métricas Generales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? [1, 2, 3, 4].map((k) => (
                <div key={k} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="h-6 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              ))
            : statCards.map((s, i) => {
                const IconComp = s.icon;
                return (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.bg} ${s.color}`}>
                        <IconComp size={20} weight="fill" />
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-slate-900 leading-none">
                          {s.value}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          {s.label}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* ── Donut Chart (Estado de Citas) + Top Médicos & Especies ── */}
      {resumen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Gráfico Donut: Estado de Citas Proporcional */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-sky-600" />
                <span>Distribución por Estado de Citas</span>
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Proporcional
              </span>
            </div>

            <div className="flex items-center justify-around gap-6 flex-wrap pt-2">
              {/* Donut Chart Semántico */}
              <SemanticDonutChart
                pendientes={resumen.citasPendientes}
                atendidas={resumen.citasAtendidas}
                canceladas={resumen.citasCanceladas}
              />

              {/* Leyenda Semántica con Valores Reales */}
              <div className="space-y-3 flex-1 min-w-[160px]">
                {/* 1. Pendientes (Amber) */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50/80">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-900">Pendientes</span>
                  </div>
                  <span className="text-sm font-extrabold text-amber-900">
                    {resumen.citasPendientes}
                  </span>
                </div>

                {/* 2. Atendidas (Emerald) */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-900">Atendidas</span>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-900">
                    {resumen.citasAtendidas}
                  </span>
                </div>

                {/* 3. Canceladas (Rose) */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-rose-200 bg-rose-50/80">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-rose-900">Canceladas</span>
                  </div>
                  <span className="text-sm font-extrabold text-rose-900">
                    {resumen.citasCanceladas}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Veterinario Más Activo + Especies Más Frecuentes */}
          <div className="space-y-4">
            {resumen.topVeterinario && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Trophy size={22} weight="fill" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Veterinario Más Activo
                    </span>
                    <p className="text-base font-extrabold text-slate-900 leading-tight">
                      {resumen.topVeterinario.veterinario}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <Check size={13} weight="bold" />
                      {resumen.topVeterinario.totalAtendidas} consultas atendidas
                    </p>
                  </div>
                </div>
              </div>
            )}

            {resumen.topEspecies.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <PawPrint size={16} className="text-sky-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Especies Más Frecuentes en Clínica
                  </h2>
                </div>
                <div className="space-y-2.5">
                  {resumen.topEspecies.map((e, i) => {
                    const pct = Math.round((e.total / Math.max(resumen.totalMascotas, 1)) * 100);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-800 capitalize">{e.especie}</span>
                          <span className="text-slate-500">{e.total} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-600 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Gráfico de Citas por Día (Barras Rectangulares Proporcionales) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Volumen de Citas por Día
            </h2>
            <p className="text-xs text-slate-500">
              Actividad clínica registrada en los últimos {diasFiltro} días
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {[7, 14, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDiasFiltro(d)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  diasFiltro === d
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
        ) : (
          <StandardBarChart
            data={citasDia}
            xKey="fechaLabel"
            yKey="total"
            barColor="bg-sky-600 hover:bg-sky-500"
            height={200}
          />
        )}
      </div>

      {/* ── Gráfico por Día de la Semana (Barras Rectangulares) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Concurrencia por Día de la Semana
          </h2>
          <p className="text-xs text-slate-500">
            Días con mayor volumen histórico de citas
          </p>
        </div>

        {loading ? (
          <div className="h-44 bg-slate-100 animate-pulse rounded-2xl" />
        ) : (
          <StandardBarChart
            data={citasSemana}
            xKey="dia"
            yKey="total"
            barColor="bg-emerald-600 hover:bg-emerald-500"
            height={180}
          />
        )}
      </div>

      {/* ── Tabla de Detalle por Día ── */}
      {citasDia.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            Detalle Diario de Citas
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Fecha', 'Total Citas', 'Atendidas', 'Pendientes', 'Canceladas'].map((col) => (
                    <th key={col} className="py-3 px-4 font-bold uppercase text-[10px] tracking-wider text-slate-500">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...citasDia].reverse().slice(0, 15).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {row.fechaLabel}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-sky-700">
                      {row.total}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {row.atendidas || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        {row.pendientes || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        {row.canceladas || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
