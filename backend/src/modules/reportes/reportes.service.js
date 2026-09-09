import * as reportesRepository from './reportes.repository.js';

export const obtenerResumen = reportesRepository.obtenerResumen;
export const obtenerCitasPorDia = reportesRepository.obtenerCitasPorDia;

export async function obtenerCitasPorDiaSemana() {
  const rows = await reportesRepository.obtenerCitasPorDiaSemana();
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return rows.map(({ diaSemana, total }) => ({ dia: dias[diaSemana - 1] ?? `Día ${diaSemana}`, total }));
}
