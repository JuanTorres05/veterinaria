import { crearUsuarioSchema, cambiarPasswordSchema } from './usuarios.schemas.js';
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
    const { id } = req.params;
    const { activo } = req.body;
    const result = await usuariosService.cambiarEstadoUsuario(Number(id), Boolean(activo));
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function cambiarPassword(req, res, next) {
  try {
    const { id } = req.params;
    const payload = cambiarPasswordSchema.parse(req.body);
    const result = await usuariosService.cambiarPasswordUsuario(Number(id), payload.password);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}
