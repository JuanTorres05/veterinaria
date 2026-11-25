import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import {
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../errors/http.errors.js';
import * as authRepository from './auth.repository.js';

const ROL_MAP = {
  'Administrador': 'admin',
  'Recepcionista': 'recepcionista',
  'Veterinario':   'veterinario',
  'Cliente':       'cliente',
};

function maskEmail(email) {
  if (!email || !email.includes('@')) return null;
  const [user, domain] = email.split('@');
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

function maskPhone(tel) {
  if (!tel) return null;
  const digits = tel.replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `***${digits.slice(-4)}`;
}

function buildAuthResponse({ id, nombre, rol, clienteId = null }) {
  const token = jwt.sign(
    {
      sub: id,
      nombre,
      rol,
      ...(clienteId ? { clienteId } : {}),
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  return {
    token,
    user: {
      id,
      nombre,
      rol,
      ...(clienteId ? { clienteId } : {}),
    },
  };
}

export async function login({ cedula, password }) {
  const user = await authRepository.buscarUsuarioParaLogin(cedula);
  if (!user) {
    throw new UnauthorizedError('Credenciales inválidas.');
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Credenciales inválidas.');
  }

  const rolNormalizado = ROL_MAP[user.rol] ?? user.rol.toLowerCase();

  return buildAuthResponse({
    id: user.id,
    nombre: user.nombre,
    rol: rolNormalizado,
    clienteId: user.cliente_id || null,
  });
}

export const listarVeterinarios = authRepository.listarVeterinariosActivos;

export async function recuperarPassword({ cedula, correo }) {
  const user = await authRepository.buscarUsuarioActivoPorCedula(cedula);
  const nombre = user?.nombre ?? 'Administrador';
  return {
    message: `Si existe una cuenta activa con esa cédula, el administrador contactará a ${correo} con las instrucciones para restablecer la contraseña.`,
    usuario: nombre,
  };
}

export async function verificarCedula({ cedula }) {
  const user = await authRepository.buscarUsuarioActivoPorCedula(cedula);
  if (!user) {
    throw new NotFoundError('No se encontró un usuario activo con esa cédula.');
  }
  return {
    encontrado: true,
    nombre: user.nombre,
    mensaje: `Hola ${user.nombre}, ingresa tu nueva contraseña.`,
  };
}

export async function cambiarPassword({ cedula, nuevaPassword }) {
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
    mensaje: `La contraseña de ${user.nombre} fue actualizada correctamente.`,
  };
}

/**
 * Paso 1 del Portal del Propietario:
 * Detecta si la cédula ya tiene cuenta activa, si existe en la clínica sin activar, o si es nuevo.
 */
export async function verificarPropietario({ cedula }) {
  const usuarioExistente = await authRepository.buscarUsuarioActivoPorCedula(cedula);
  if (usuarioExistente) {
    return {
      estado: 'tiene_cuenta',
      mensaje: 'Esta cédula ya tiene una cuenta activa en DataVet. Puedes iniciar sesión directamente.',
    };
  }

  const cliente = await authRepository.buscarClientePorCedula(cedula);
  if (cliente) {
    return {
      estado: 'activar',
      nombre: `${cliente.nombre} ${cliente.apellido || ''}`.trim(),
      pistaCorreo: maskEmail(cliente.email),
      pistaTelefono: maskPhone(cliente.telefono),
      requiereCorreo: !cliente.email,
      totalMascotas: Number(cliente.total_mascotas || 0),
    };
  }

  return {
    estado: 'nuevo',
    mensaje: 'No encontramos un registro previo con esta cédula. Completa tus datos para crear tu cuenta.',
  };
}

/**
 * Paso 2 del Portal del Propietario:
 * Activa acceso para un cliente ya existente en la clínica o crea uno nuevo.
 */
export async function registroPropietario(payload) {
  const rolId = await authRepository.buscarRolPorNombre('Cliente');
  if (!rolId) {
    throw new BadRequestError('El rol de Cliente no está configurado en el sistema.');
  }

  const usuarioExistente = await authRepository.buscarUsuarioActivoPorCedula(payload.cedula);
  if (usuarioExistente) {
    throw new ConflictError('Ya existe una cuenta activa con esta cédula. Inicia sesión.');
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  if (payload.modo === 'activar') {
    const cliente = await authRepository.buscarClientePorCedula(payload.cedula);
    if (!cliente) {
      throw new NotFoundError('No encontramos un propietario registrado con esa cédula.');
    }
    if (cliente.id_usuario) {
      throw new ConflictError('Esta cuenta de propietario ya fue activada. Inicia sesión.');
    }

    // Validar identidad con correo o últimos 4 dígitos del teléfono
    const verif = (payload.verificacion || '').trim().toLowerCase();
    const emailMatch = cliente.email && verif === cliente.email.trim().toLowerCase();
    const phoneDigits = (cliente.telefono || '').replace(/\D/g, '');
    const verifDigits = verif.replace(/\D/g, '');
    const phoneMatch =
      phoneDigits.length >= 4 &&
      (verifDigits === phoneDigits || (verifDigits.length === 4 && phoneDigits.endsWith(verifDigits)));

    if (!emailMatch && !phoneMatch) {
      throw new UnauthorizedError(
        'El correo electrónico o los últimos 4 dígitos del teléfono no coinciden con los registrados en la clínica.'
      );
    }

    const emailFinal = (cliente.email || payload.correoAlternativo || '').trim().toLowerCase();
    if (!emailFinal || !emailFinal.includes('@')) {
      throw new BadRequestError('Ingresa un correo electrónico válido para completar tu cuenta.');
    }

    const emailDuplicado = await authRepository.buscarUsuarioPorEmailOCedula(emailFinal, payload.cedula);
    if (emailDuplicado) {
      throw new ConflictError('Ese correo electrónico o cédula ya está en uso por otra cuenta.');
    }

    const nombreCompleto = `${cliente.nombre} ${cliente.apellido || ''}`.trim();
    const { usuarioId, clienteId } = await authRepository.activarCuentaPropietario({
      clienteId: cliente.id_cliente,
      nombreCompleto,
      email: emailFinal,
      cedula: payload.cedula,
      passwordHash,
      rolId,
    });

    return buildAuthResponse({
      id: usuarioId,
      nombre: nombreCompleto,
      rol: 'cliente',
      clienteId,
    });
  }

  // Modo 'nuevo'
  const nombreFull = (payload.nombre || '').trim();
  const telefono = (payload.telefono || '').trim();
  const correo = (payload.correo || '').trim().toLowerCase();
  const direccion = (payload.direccion || '').trim();

  if (nombreFull.length < 3) {
    throw new BadRequestError('Ingresa tu nombre completo (mínimo 3 caracteres).');
  }
  if (telefono.replace(/\D/g, '').length < 7) {
    throw new BadRequestError('Ingresa un número telefónico válido (mínimo 7 dígitos).');
  }
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new BadRequestError('Ingresa un correo electrónico válido.');
  }
  if (direccion.length < 5) {
    throw new BadRequestError('La dirección de residencia es obligatoria (mínimo 5 caracteres).');
  }

  const clientePrevio = await authRepository.buscarClientePorCedula(payload.cedula);
  if (clientePrevio) {
    throw new ConflictError('Esta cédula ya está registrada en la clínica. Usa la opción de activar cuenta.');
  }

  const dup = await authRepository.buscarUsuarioPorEmailOCedula(correo, payload.cedula);
  if (dup) {
    throw new ConflictError('Ya existe una cuenta registrada con ese correo o cédula.');
  }

  const partes = nombreFull.split(/\s+/);
  const nombre = partes[0];
  const apellido = partes.slice(1).join(' ');

  const { usuarioId, clienteId } = await authRepository.registrarNuevoPropietario({
    nombre,
    apellido,
    nombreCompleto: nombreFull,
    cedula: payload.cedula,
    telefono,
    correo,
    direccion: payload.direccion || null,
    passwordHash,
    rolId,
    mascota: payload.mascota || null,
  });

  return buildAuthResponse({
    id: usuarioId,
    nombre: nombreFull,
    rol: 'cliente',
    clienteId,
  });
}
