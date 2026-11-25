import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../errors/http.errors.js';
import * as portalRepository from './portal.repository.js';
import * as mascotasService from '../mascotas/mascotas.service.js';
import * as citasRepository from '../citas/citas.repository.js';

const HORARIOS_CLINICA = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00',
];

function ensureClienteId(user) {
  if (!user?.clienteId) {
    throw new ForbiddenError('Tu cuenta no está vinculada a un perfil de propietario.');
  }
  return user.clienteId;
}

export async function obtenerResumen(user) {
  const clienteId = ensureClienteId(user);
  const [perfil, mascotas, citas, hospitalizacionesActivas] = await Promise.all([
    portalRepository.obtenerPerfilCliente(clienteId),
    portalRepository.listarMascotasCliente(clienteId),
    portalRepository.listarCitasCliente(clienteId),
    portalRepository.listarHospitalizacionesActivasCliente(clienteId),
  ]);

  if (!perfil) {
    throw new NotFoundError('Perfil de propietario no encontrado.');
  }

  const ahora = new Date();
  const proximasCitas = citas
    .filter((c) => c.estado === 'pendiente' && new Date(c.fecha_hora) >= new Date(ahora.getTime() - 3600 * 1000))
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  return {
    perfil,
    mascotas,
    proximasCitas,
    hospitalizacionesActivas,
    stats: {
      totalMascotas: mascotas.length,
      citasPendientes: proximasCitas.length,
      hospitalizacionesActivas: hospitalizacionesActivas.length,
      totalCitasHistoricas: citas.length,
    },
  };
}

export async function actualizarPerfil(user, payload) {
  const clienteId = ensureClienteId(user);
  await portalRepository.actualizarPerfilCliente(clienteId, user.sub, payload);
  return portalRepository.obtenerPerfilCliente(clienteId);
}

export async function crearMascota(user, payload) {
  const clienteId = ensureClienteId(user);
  const mascotaId = await portalRepository.crearMascotaCliente(clienteId, payload);
  return mascotasService.obtenerPorId(mascotaId);
}

export async function obtenerMascotaPropia(user, mascotaId) {
  const clienteId = ensureClienteId(user);
  const esPropia = await portalRepository.perteneceMascotaACliente(mascotaId, clienteId);
  if (!esPropia) {
    throw new NotFoundError('Mascota no encontrada en tu cuenta.');
  }
  return mascotasService.obtenerPorId(mascotaId);
}

export async function subirFotoMascotaPropia(user, mascotaId, payload) {
  const clienteId = ensureClienteId(user);
  const esPropia = await portalRepository.perteneceMascotaACliente(mascotaId, clienteId);
  if (!esPropia) {
    throw new NotFoundError('Mascota no encontrada en tu cuenta.');
  }
  return mascotasService.actualizarFotoMascota(mascotaId, payload);
}

export async function listarCitasPropias(user) {
  const clienteId = ensureClienteId(user);
  return portalRepository.listarCitasCliente(clienteId);
}

export async function obtenerDisponibilidad(veterinarioId, fecha) {
  if (!veterinarioId || !fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new BadRequestError('Debes indicar veterinarioId y fecha (YYYY-MM-DD).');
  }
  const ocupadas = new Set(await portalRepository.listarHorasOcupadasVeterinario(veterinarioId, fecha));

  // Si la fecha es hoy, filtrar horas que ya pasaron
  const ahora = new Date();
  const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  const slots = HORARIOS_CLINICA.map((hora) => {
    const [h, m] = hora.split(':').map(Number);
    const yaPaso = fecha < hoyStr || (fecha === hoyStr && h * 60 + m <= minutosAhora + 15);
    return {
      hora,
      disponible: !ocupadas.has(hora) && !yaPaso,
      motivo: ocupadas.has(hora) ? 'Ocupado' : yaPaso ? 'Pasado' : null,
    };
  });

  return { fecha, veterinarioId, slots };
}

export async function agendarCitaPropia(user, payload) {
  const clienteId = ensureClienteId(user);
  const esPropia = await portalRepository.perteneceMascotaACliente(payload.mascota_id, clienteId);
  if (!esPropia) {
    throw new ForbiddenError('Solo puedes agendar citas para tus propias mascotas.');
  }

  const fechaObj = new Date(payload.fecha_hora);
  if (Number.isNaN(fechaObj.getTime()) || fechaObj.getTime() < Date.now() - 5 * 60 * 1000) {
    throw new BadRequestError('No puedes agendar una cita en una fecha u hora que ya pasó.');
  }

  const solapadaVet = await citasRepository.buscarSolapada(payload.veterinario_id, payload.fecha_hora, 30);
  if (solapadaVet) {
    throw new ConflictError('Ese horario ya fue reservado con este veterinario. Elige otra hora disponible.');
  }

  const solapadaMascota = await citasRepository.buscarSolapadaMascota(payload.mascota_id, payload.fecha_hora, 30);
  if (solapadaMascota) {
    throw new ConflictError('Tu mascota ya tiene otra cita agendada en ese mismo horario.');
  }

  const creada = await citasRepository.crear({
    mascota_id: payload.mascota_id,
    usuario_id: payload.veterinario_id,
    usuario_registro_id: user.sub,
    fecha_hora: payload.fecha_hora,
    motivo: payload.motivo,
  });
  // Las citas reservadas directamente por el propietario nacen confirmadas
  await citasRepository.actualizarEstado(creada.id, 'confirmada', null);
  return citasRepository.buscarPorId(creada.id);
}

export async function confirmarCitaPropia(user, citaId) {
  const clienteId = ensureClienteId(user);
  const cita = await portalRepository.obtenerCitaDeCliente(citaId, clienteId);
  if (!cita) {
    throw new NotFoundError('La cita no existe o no pertenece a tu cuenta.');
  }
  if (!['Programada', 'Confirmada'].includes(cita.estado_detalle)) {
    throw new BadRequestError('Solo puedes confirmar citas que estén programadas.');
  }
  await citasRepository.actualizarEstado(citaId, 'confirmada', null);
  return citasRepository.buscarPorId(citaId);
}

export async function cancelarCitaPropia(user, citaId, motivoCancelacion) {
  const clienteId = ensureClienteId(user);
  const cita = await portalRepository.obtenerCitaDeCliente(citaId, clienteId);
  if (!cita) {
    throw new NotFoundError('La cita no existe o no pertenece a tu cuenta.');
  }
  if (!['Programada', 'Confirmada'].includes(cita.estado_detalle)) {
    throw new BadRequestError('Esta cita ya no puede cancelarse.');
  }
  const nota = `Cancelada por propietario: ${motivoCancelacion.trim()}`;
  await citasRepository.actualizarEstado(citaId, 'cancelada', nota);
  return citasRepository.buscarPorId(citaId);
}
