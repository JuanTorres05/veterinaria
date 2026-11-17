import { NotFoundError } from '../../errors/http.errors.js';
import * as mascotasRepository from './mascotas.repository.js';

export const listarMedicamentos = mascotasRepository.listarMedicamentos;
export const listarPorCliente = mascotasRepository.listarPorCliente;

export async function obtenerPorId(mascotaId) {
  const mascota = await mascotasRepository.buscarFicha(mascotaId);
  if (!mascota) throw new NotFoundError('Mascota no encontrada.');

  const [historial, procedimientos, hospitalizaciones, citas] = await Promise.all([
    mascotasRepository.listarHistorial(mascotaId),
    mascotasRepository.listarProcedimientos(mascotaId),
    mascotasRepository.listarHospitalizaciones(mascotaId),
    mascotasRepository.listarCitas(mascotaId)
  ]);

  return {
    id: mascota.id, nombre: mascota.nombre, especie: mascota.especie, raza: mascota.raza,
    sexo: mascota.sexo, fechaNacimiento: mascota.fecha_nacimiento, pesoKg: mascota.peso_kg,
    color: mascota.color, microchip: mascota.microchip, observaciones: mascota.observaciones,
    fotoUrl: mascota.foto_url, createdAt: mascota.created_at,
    cliente: { id: mascota.cliente_id, nombre: mascota.cliente_nombre, cedula: mascota.cliente_cedula,
      telefono: mascota.cliente_telefono, correo: mascota.cliente_correo, direccion: mascota.cliente_direccion },
    historial, procedimientos, hospitalizaciones, citas
  };
}

export const crearHistorial = mascotasRepository.crearHistorial;
export const subirArchivosConsulta = mascotasRepository.subirArchivosConsulta;
export const crearProcedimiento = mascotasRepository.crearProcedimiento;
export const subirArchivosProcedimiento = mascotasRepository.subirArchivosProcedimiento;
export const actualizarFotoMascota = mascotasRepository.actualizarFotoMascota;
export const eliminarArchivo = mascotasRepository.eliminarArchivo;
