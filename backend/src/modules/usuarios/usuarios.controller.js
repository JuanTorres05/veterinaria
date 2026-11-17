import { crearUsuarioSchema, cambiarPasswordSchema, cambiarEstadoSchema } from './usuarios.schemas.js';
import * as usuariosService from './usuarios.service.js';

export async function listar(req, res, next) {
  try {
    const result = await usuariosService.listarUsuarios();
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function crear(req, res, next) {
  try {
    const payload = crearUsuarioSchema.parse(req.body);
    const result = await usuariosService.crearUsuario(payload);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    // SEGURIDAD I1: validar ID antes de llegar al servicio
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'El ID de usuario no es válido.' });
    }
    // SEGURIDAD C2: parsear con Zod para asegurar que activo sea boolean estricto
    const { activo } = cambiarEstadoSchema.parse(req.body);
    const result = await usuariosService.cambiarEstadoUsuario(id, activo, req.user?.sub);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function cambiarPassword(req, res, next) {
  try {
    // SEGURIDAD I1: validar ID antes de llegar al servicio
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'El ID de usuario no es válido.' });
    }
    const payload = cambiarPasswordSchema.parse(req.body);
    const result = await usuariosService.cambiarPasswordUsuario(id, payload.password);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}
