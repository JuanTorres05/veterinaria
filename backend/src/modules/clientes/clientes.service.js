// Servicio para el registro de clientes y mascotas (HU-02)
// Ahora acepta campos extendidos: cedula, direccion en clientes;
// sexo, fecha_nacimiento, peso_kg, color en mascotas.

import { ConflictError } from '../../errors/http.errors.js';
import { withTransaction } from '../../db/transaction.js';
import * as clientesRepository from './clientes.repository.js';

export async function registrarClienteMascota({ cliente, mascotas }) {
  // Validación de duplicados: No permitir registrar el mismo cliente
  const clientePorCedula = await clientesRepository.buscarPorCedula(cliente.cedula);
  if (clientePorCedula) {
    throw new ConflictError(`El cliente ya se encuentra registrado con la cédula ${cliente.cedula} (${clientePorCedula.nombre}).`);
  }

  const clientePorCorreo = await clientesRepository.buscarPorCorreo(cliente.correo);
  if (clientePorCorreo) {
    throw new ConflictError(`Ya existe un cliente registrado con el correo electrónico ${cliente.correo}.`);
  }

  return withTransaction(async (connection) => {
    const clienteId = await clientesRepository.crearCliente(cliente, connection);
    const mascotasInsertadas = [];
    for (const mascota of mascotas) {
      mascotasInsertadas.push({
        id: await clientesRepository.crearMascota(clienteId, mascota, connection),
        clienteId,
        ...mascota
      });
    }
    return { cliente: { id: clienteId, ...cliente }, mascotas: mascotasInsertadas };
  });
}

export async function listarClientes() {
  const rows = await clientesRepository.listarConMascotas();

  const clientesMap = new Map();

  for (const row of rows) {
    if (!clientesMap.has(row.id)) {
      clientesMap.set(row.id, {
        id: row.id,
        nombre: row.nombre,
        cedula: row.cedula,
        direccion: row.direccion,
        telefono: row.telefono,
        correo: row.correo,
        createdAt: row.created_at,
        mascotas: []
      });
    }

    if (row.mascota_id) {
      clientesMap.get(row.id).mascotas.push({
        id: row.mascota_id,
        nombre: row.mascota_nombre,
        especie: row.especie,
        raza: row.raza,
        sexo: row.sexo
      });
    }
  }

  return Array.from(clientesMap.values());
}
