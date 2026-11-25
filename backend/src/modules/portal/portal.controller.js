import * as portalService from './portal.service.js';
import {
  actualizarPerfilSchema,
  crearMascotaPortalSchema,
  agendarCitaPortalSchema,
  subirFotoPortalSchema,
  cancelarCitaPortalSchema,
} from './portal.schemas.js';

export async function resumen(req, res, next) {
  try {
    const data = await portalService.obtenerResumen(req.user);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function actualizarPerfil(req, res, next) {
  try {
    const payload = actualizarPerfilSchema.parse(req.body);
    const data = await portalService.actualizarPerfil(req.user, payload);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function crearMascota(req, res, next) {
  try {
    const payload = crearMascotaPortalSchema.parse(req.body);
    const data = await portalService.crearMascota(req.user, payload);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
}

export async function obtenerMascota(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID de mascota no válido.' });
    }
    const data = await portalService.obtenerMascotaPropia(req.user, id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function subirFotoMascota(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID de mascota no válido.' });
    }
    const payload = subirFotoPortalSchema.parse(req.body);
    const data = await portalService.subirFotoMascotaPropia(req.user, id, payload);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function listarCitas(req, res, next) {
  try {
    const data = await portalService.listarCitasPropias(req.user);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function disponibilidad(req, res, next) {
  try {
    const veterinarioId = parseInt(req.query.veterinarioId, 10);
    const fecha = String(req.query.fecha || '').trim();
    const data = await portalService.obtenerDisponibilidad(veterinarioId, fecha);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function agendarCita(req, res, next) {
  try {
    const payload = agendarCitaPortalSchema.parse(req.body);
    const data = await portalService.agendarCitaPropia(req.user, payload);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
}

export async function confirmarCita(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID de cita no válido.' });
    }
    const data = await portalService.confirmarCitaPropia(req.user, id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function cancelarCita(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID de cita no válido.' });
    }
    const { motivo_cancelacion } = cancelarCitaPortalSchema.parse(req.body || {});
    const data = await portalService.cancelarCitaPropia(req.user, id, motivo_cancelacion);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}
