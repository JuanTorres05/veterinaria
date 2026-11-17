import { NotFoundError, ConflictError } from '../../errors/http.errors.js';
import * as citasRepository from './citas.repository.js';

export const listarCitas = citasRepository.listar;

export async function crearCita(payload) {
  const duracion = payload.duracion_min || 30;
  const solapadaVet = await citasRepository.buscarSolapada(payload.usuario_id, payload.fecha_hora, duracion);
  if (solapadaVet) {
    throw new ConflictError('El profesional veterinario ya tiene una cita agendada que se cruza con ese horario.');
  }
  const solapadaMascota = await citasRepository.buscarSolapadaMascota(payload.mascota_id, payload.fecha_hora, duracion);
  if (solapadaMascota) {
    throw new ConflictError('La mascota ya tiene otra cita agendada en ese mismo horario.');
  }
  return citasRepository.crear({ ...payload, duracion_min: duracion });
}

export async function cambiarEstadoCita(id, estado, notasCancelacion) {
  const notas = (estado === 'cancelada' || estado === 'no_asistio') ? notasCancelacion : null;
  const updated = await citasRepository.actualizarEstado(id, estado, notas);
  if (!updated) throw new NotFoundError('La cita especificada no existe.');
  return citasRepository.buscarPorId(id);
}

export async function eliminarCita(id) {
  if (!await citasRepository.eliminar(id)) throw new NotFoundError('La cita especificada no existe.');
}

export const obtenerStatsDashboard = citasRepository.obtenerEstadisticas;
