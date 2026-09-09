import * as reportesService from './reportes.service.js';

export async function resumen(req, res, next) {
  try {
    const data = await reportesService.obtenerResumen();
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function citasPorDia(req, res, next) {
  try {
    // SEGURIDAD C3: limitar el rango para evitar consultas SQL de millones de días
    const dias = Math.min(Math.max(parseInt(req.query.dias, 10) || 30, 1), 365);
    const data = await reportesService.obtenerCitasPorDia(dias);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function citasPorDiaSemana(req, res, next) {
  try {
    const data = await reportesService.obtenerCitasPorDiaSemana();
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}
