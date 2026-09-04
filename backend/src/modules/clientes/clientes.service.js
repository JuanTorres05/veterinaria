// Servicio para el registro de clientes y mascotas (HU-02)
// Ahora acepta campos extendidos: cedula, direccion en clientes;
// sexo, fecha_nacimiento, peso_kg, color en mascotas.

import pool from '../../db/pool.js';

export async function registrarClienteMascota({ cliente, mascotas }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Paso 1: insertar el cliente (con nuevos campos opcionales)
    const [clienteResult] = await connection.execute(
      `INSERT INTO clientes (nombre, cedula, direccion, telefono, correo)
       VALUES (?, ?, ?, ?, ?)`,
      [
        cliente.nombre,
        cliente.cedula    || null,
        cliente.direccion || null,
        cliente.telefono,
        cliente.correo
      ]
    );

    const clienteId = clienteResult.insertId;

    // Paso 2: insertar cada mascota con campos extendidos
    const mascotasInsertadas = [];

    for (const mascota of mascotas) {
      const [mascotaResult] = await connection.execute(
        `INSERT INTO mascotas (cliente_id, nombre, especie, raza, sexo, fecha_nacimiento, peso_kg, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clienteId,
          mascota.nombre,
          mascota.especie,
          mascota.raza,
          mascota.sexo             || 'Desconocido',
          mascota.fechaNacimiento  || null,
          mascota.pesoKg           || null,
          mascota.color            || null
        ]
      );

      mascotasInsertadas.push({
        id: mascotaResult.insertId,
        clienteId,
        ...mascota
      });
    }

    await connection.commit();

    return {
      cliente: { id: clienteId, ...cliente },
      mascotas: mascotasInsertadas
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function listarClientes() {
  const [rows] = await pool.execute(
    `SELECT c.id, c.nombre, c.cedula, c.direccion, c.telefono, c.correo, c.created_at,
            m.id AS mascota_id, m.nombre AS mascota_nombre, m.especie, m.raza, m.sexo
     FROM clientes c 
     LEFT JOIN mascotas m ON m.cliente_id = c.id 
     ORDER BY c.nombre`
  );

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
