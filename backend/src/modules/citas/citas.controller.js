import * as citasService from './citas.service.js';
import { crearCitaSchema, cambiarEstadoSchema } from './citas.schemas.js';

export async function listar(req, res, next) {
  try {
    const { fecha, estado } = req.query;
    const result = await citasService.listarCitas({ fecha, estado });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function crear(req, res, next) {
  try {
    const payload = crearCitaSchema.parse(req.body);
    const result = await citasService.crearCita(payload);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    // SEGURIDAD I1: validar ID antes de llegar al servicio
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'El ID de cita no es válido.' });
    }
    const { estado, notas_cancelacion } = cambiarEstadoSchema.parse(req.body);
    const result = await citasService.cambiarEstadoCita(id, estado, notas_cancelacion || null);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    // SEGURIDAD I1: validar ID antes de llegar al servicio
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'El ID de cita no es válido.' });
    }
    await citasService.eliminarCita(id);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

export async function dashboardStats(req, res, next) {
  try {
    const result = await citasService.obtenerStatsDashboard();
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

