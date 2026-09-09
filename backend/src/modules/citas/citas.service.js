import { NotFoundError, ConflictError } from '../../errors/http.errors.js';
import * as citasRepository from './citas.repository.js';

export const listarCitas = citasRepository.listar;

export async function crearCita(payload) {
  const solapada = await citasRepository.buscarSolapada(payload.usuario_id, payload.fecha_hora);
  if (solapada) {
    throw new ConflictError('El profesional veterinario ya tiene una cita agendada en esta misma fecha y hora.');
  }
  return citasRepository.crear({ ...payload, duracion_min: payload.duracion_min || 30 });
}

export async function cambiarEstadoCita(id, estado, notasCancelacion) {
  const updated = await citasRepository.actualizarEstado(id, estado, estado === 'cancelada' ? notasCancelacion : null);
  if (!updated) throw new NotFoundError('La cita especificada no existe.');
  return citasRepository.buscarPorId(id);
}

export async function eliminarCita(id) {
  if (!await citasRepository.eliminar(id)) throw new NotFoundError('La cita especificada no existe.');
}

export const obtenerStatsDashboard = citasRepository.obtenerEstadisticas;
