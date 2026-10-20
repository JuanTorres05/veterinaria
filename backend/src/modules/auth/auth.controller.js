// Controlador de autenticación
// Su trabajo es recibir la petición, pasarla al servicio y devolver la respuesta
// Si hay error lo manda al manejador global (error.middleware.js)

import {
  loginSchema,
  recuperarPasswordSchema,
  verificarCedulaSchema,
  cambiarPasswordSchema
} from './auth.schemas.js';
import * as authService from './auth.service.js';

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);
    // SEGURIDAD: evitar que proxies intermedios cacheen el token JWT
    res.setHeader('Cache-Control', 'no-store');
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

/**
 * POST /api/auth/verificar-cedula
 * Paso 1: comprueba que la cédula existe en el sistema y devuelve el nombre del usuario.
 */
export async function verificarCedula(req, res, next) {
  try {
    const payload = verificarCedulaSchema.parse(req.body);
    const result = await authService.verificarCedula(payload);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/cambiar-password
 * Paso 2: recibe cédula + nueva contraseña + confirmación y actualiza en la BD.
 */
export async function cambiarPassword(req, res, next) {
  try {
    const payload = cambiarPasswordSchema.parse(req.body);
    const result = await authService.cambiarPassword(payload);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

