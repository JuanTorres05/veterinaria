// Controlador de autenticación
// Su trabajo es recibir la petición, pasarla al servicio y devolver la respuesta
// Si hay error lo manda al manejador global (error.middleware.js)

import { loginSchema, recuperarPasswordSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function listarVets(req, res, next) {
  try {
    const result = await authService.listarVeterinarios();
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function recuperarPassword(req, res, next) {
  try {
    const payload = recuperarPasswordSchema.parse(req.body);
    const result = await authService.recuperarPassword(payload);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}
