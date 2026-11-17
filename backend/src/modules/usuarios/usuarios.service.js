import bcrypt from 'bcryptjs';
import { ConflictError, NotFoundError } from '../../errors/http.errors.js';
import * as usuariosRepository from './usuarios.repository.js';

const ROL_MAP = {
  'Administrador': 'admin',
  'Recepcionista':  'recepcionista',
  'Veterinario':    'veterinario',
};

export const listarUsuarios = usuariosRepository.listar;

export async function crearUsuario({ cedula, nombre, password, rol_id }) {
  if (await usuariosRepository.buscarPorCedula(cedula)) {
    throw new ConflictError('Ya existe un trabajador registrado con esta cédula.');
  }
  const id = await usuariosRepository.crear({ 
    cedula, 
    nombre, 
    password_hash: await bcrypt.hash(password, 12), 
    rol_id 
  });
  const rol = await usuariosRepository.buscarRol(rol_id);
  const rolTexto = ROL_MAP[rol?.nombre] || (rol?.nombre || 'desconocido').toLowerCase();
  return { id, cedula, nombre, rol_id, rol: rolTexto, activo: 1 };
}

async function asegurarUsuarioExiste(id) {
  if (!await usuariosRepository.existe(id)) throw new NotFoundError('Trabajador no encontrado.');
}

export async function cambiarEstadoUsuario(id, activo, actorId = null) {
  await asegurarUsuarioExiste(id);
  if (!activo && actorId && Number(id) === Number(actorId)) {
    throw new ConflictError('No puedes desactivar tu propia cuenta mientras tienes la sesión activa.');
  }
  if (!activo) {
    const citasFuturas = await usuariosRepository.contarCitasFuturasPendientes(id);
    if (citasFuturas > 0) {
      throw new ConflictError(
        `No se puede desactivar al profesional porque tiene ${citasFuturas} cita(s) futura(s) pendiente(s). Reasigna o cancela sus citas primero.`
      );
    }
  }
  await usuariosRepository.actualizarEstado(id, activo);
  return { message: `Estado del usuario actualizado a ${activo ? 'activo' : 'inactivo'}.` };
}

export async function cambiarPasswordUsuario(id, password) {
  await asegurarUsuarioExiste(id);
  await usuariosRepository.actualizarPassword(id, await bcrypt.hash(password, 12));
  return { message: 'Contraseña actualizada exitosamente.' };
}
