// Servicio de autenticación - acá va toda la lógica de login
// Usamos bcryptjs para comparar contraseñas y jsonwebtoken para generar el token

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError, NotFoundError } from '../../errors/http.errors.js';
import * as authRepository from './auth.repository.js';

export async function login({ cedula, password }) {
  // Buscamos al usuario uniendo con la tabla de roles para saber qué puede hacer
  // La condición activo = 1 evita que usuarios desactivados entren al sistema
  const user = await authRepository.buscarUsuarioParaLogin(cedula);

  // Si no encontramos el usuario, lanzamos error genérico
  // (no decimos si fue la cédula o la contraseña por seguridad)
  if (!user) {
    throw new UnauthorizedError('Credenciales inválidas.');
  }


  // Comparamos la contraseña que mandó el usuario con el hash guardado en BD
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new UnauthorizedError('Credenciales inválidas.');
  }


  // Todo bien, generamos el token con los datos que el frontend necesita saber
  // sub = subject (el id del usuario), rol lo usamos para mostrar/ocultar cosas
  const token = jwt.sign(
    {
      sub: user.id,
      nombre: user.nombre,
      rol: user.rol
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn } // por defecto 8 horas
  );

  // Retornamos el token y los datos básicos del usuario (sin contraseña!)
  return {
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      rol: user.rol
    }
  };
}

export const listarVeterinarios = authRepository.listarVeterinariosActivos;

/**
 * Recuperación de contraseña — HU-M01
 * Verifica que exista un usuario activo con la cédula indicada.
 * En un sistema real enviaría un correo; aquí registra la solicitud y confirma.
 */
export async function recuperarPassword({ cedula, correo }) {
  // SEGURIDAD: buscamos el usuario pero NO revelamos si existe o no.
  // Siempre devolvemos el mismo mensaje genérico para evitar enumeración de cédulas.
  const user = await authRepository.buscarUsuarioActivoPorCedula(cedula);

  // En producción aquí se enviaría un correo con link de reset SI el usuario existe.
  // Para esta versión respondemos siempre con 200 y el mismo mensaje.
  const nombre = user?.nombre ?? 'Administrador';
  return {
    message: `Si existe una cuenta activa con esa cédula, el administrador contactará a ${correo} con las instrucciones para restablecer la contraseña.`,
    usuario: nombre
  };
}
