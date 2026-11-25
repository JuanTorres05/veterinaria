import {
  loginSchema,
  recuperarPasswordSchema,
  verificarCedulaSchema,
  cambiarPasswordSchema,
  verificarPropietarioSchema,
  registroPropietarioSchema,
} from './auth.schemas.js';
import * as authService from './auth.service.js';

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);
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

export async function verificarCedula(req, res, next) {
  try {
    const payload = verificarCedulaSchema.parse(req.body);
    const result = await authService.verificarCedula(payload);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function cambiarPassword(req, res, next) {
  try {
    const payload = cambiarPasswordSchema.parse(req.body);
    const result = await authService.cambiarPassword(payload);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function verificarPropietario(req, res, next) {
  try {
    const payload = verificarPropietarioSchema.parse(req.body);
    const result = await authService.verificarPropietario(payload);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function registroPropietario(req, res, next) {
  try {
    const payload = registroPropietarioSchema.parse(req.body);
    const result = await authService.registroPropietario(payload);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}
