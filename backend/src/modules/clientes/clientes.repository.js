import pool from '../../db/pool.js';

export async function buscarPorCedula(cedula, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT id, nombre, cedula, correo FROM clientes WHERE cedula = ? LIMIT 1',
    [cedula]
  );
  return rows[0] || null;
}

export async function buscarPorCorreo(correo, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT id, nombre, cedula, correo FROM clientes WHERE correo = ? LIMIT 1',
    [correo]
  );
  return rows[0] || null;
}

export async function crearCliente(cliente, executor = pool) {
  const [result] = await executor.execute(
    `INSERT INTO clientes (nombre, cedula, direccion, telefono, correo)
     VALUES (?, ?, ?, ?, ?)`,
    [cliente.nombre, cliente.cedula, cliente.direccion || null, cliente.telefono, cliente.correo]
  );
  return result.insertId;
}

export async function crearMascota(clienteId, mascota, executor = pool) {
  const [result] = await executor.execute(
    `INSERT INTO mascotas (cliente_id, nombre, especie, raza, sexo, fecha_nacimiento, peso_kg, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [clienteId, mascota.nombre, mascota.especie, mascota.raza, mascota.sexo || 'Desconocido',
      mascota.fechaNacimiento || null, mascota.pesoKg || null, mascota.color || null]
  );
  return result.insertId;
}

export async function listarConMascotas() {
  const [rows] = await pool.execute(
    `SELECT c.id, c.nombre, c.cedula, c.direccion, c.telefono, c.correo, c.created_at,
            m.id AS mascota_id, m.nombre AS mascota_nombre, m.especie, m.raza, m.sexo
     FROM clientes c LEFT JOIN mascotas m ON m.cliente_id = c.id ORDER BY c.nombre`
  );
  return rows;
}
