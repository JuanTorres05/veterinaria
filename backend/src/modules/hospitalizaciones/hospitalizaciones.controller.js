import { z } from 'zod';
import {
  crearHospitalizacionSchema,
  actualizarHospitalizacionSchema,
} from './hospitalizaciones.schemas.js';
import * as hospitalizacionesService from './hospitalizaciones.service.js';

export async function listar(req, res, next) {
  try {
    const { estado } = req.query;
    const result = await hospitalizacionesService.listarHospitalizaciones({ estado });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function crear(req, res, next) {
  try {
    const payload = crearHospitalizacionSchema.parse(req.body);
    const result = await hospitalizacionesService.crearHospitalizacion({
      ...payload,
      usuario_id: req.user.sub,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function actualizar(req, res, next) {
  try {
    const id = z.coerce.number().int().positive('El ID de hospitalización no es válido.').parse(req.params.id);
    const payload = actualizarHospitalizacionSchema.parse(req.body);
    const result = await hospitalizacionesService.actualizarHospitalizacion(id, {
      ...payload,
      usuario_id: req.user.sub,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}
