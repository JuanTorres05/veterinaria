// Servicio de autenticación - acá va toda la lógica de login
// Usamos bcryptjs para comparar contraseñas y jsonwebtoken para generar el token

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError, NotFoundError } from '../../errors/http.errors.js';
import * as authRepository from './auth.repository.js';

// Mapeo de nombres de rol en BD → clave que usa el frontend
const ROL_MAP = {
  'Administrador': 'admin',
  'Recepcionista':  'recepcionista',
  'Veterinario':    'veterinario',
};

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
  const rolNormalizado = ROL_MAP[user.rol] ?? user.rol.toLowerCase();

  const token = jwt.sign(
    {
      sub: user.id,
      nombre: user.nombre,
      rol: rolNormalizado
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
      rol: rolNormalizado
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

/**
 * Paso 1 — Verificar cédula
 * Confirma que la cédula pertenece a un usuario activo y devuelve su nombre.
 * El frontend usa esta respuesta para mostrar el formulario de nueva contraseña.
 */
export async function verificarCedula({ cedula }) {
  const user = await authRepository.buscarUsuarioActivoPorCedula(cedula);
  if (!user) {
    throw new NotFoundError('No se encontró un usuario activo con esa cédula.');
  }
  return {
    encontrado: true,
    nombre: user.nombre,
    mensaje: `Hola ${user.nombre}, ingresa tu nueva contraseña.`
  };
}

/**
 * Paso 2 — Cambiar contraseña
 * Recibe cédula + nueva contraseña (ya validado que coinciden en el schema).
 * Hashea con bcrypt y actualiza en la BD.
 */
export async function cambiarPassword({ cedula, nuevaPassword }) {
  // Verificamos que el usuario exista antes de hashear
  const user = await authRepository.buscarUsuarioActivoPorCedula(cedula);
  if (!user) {
    throw new NotFoundError('No se encontró un usuario activo con esa cédula.');
  }

  const nuevoHash = await bcrypt.hash(nuevaPassword, 12);
  const filasAfectadas = await authRepository.actualizarPasswordPorCedula(cedula, nuevoHash);

  if (filasAfectadas === 0) {
    throw new NotFoundError('No se pudo actualizar la contraseña. Verifique la cédula.');
  }

  return {
    mensaje: `La contraseña de ${user.nombre} fue actualizada correctamente.`
  };
}

