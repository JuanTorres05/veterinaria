import pool from '../../db/pool.js';
import { guardarFotoMascotaEnDisco } from '../mascotas/mascotas.repository.js';

export async function buscarPorId(id, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT id_cliente AS id, nombre, apellido, cedula, email AS correo FROM clientes WHERE id_cliente = ? AND activo = 1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function buscarPorCedula(cedula, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT id_cliente AS id, nombre, apellido, cedula, email AS correo FROM clientes WHERE cedula = ? AND activo = 1 LIMIT 1',
    [cedula]
  );
  return rows[0] || null;
}

export async function buscarPorCorreo(email, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT id_cliente AS id, nombre, apellido, cedula, email AS correo FROM clientes WHERE email = ? AND activo = 1 LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

export async function crearCliente(cliente, executor = pool) {
  // Manejo de nombre y apellido: si viene solo 'nombre', separar el primer término del resto
  let nombre = cliente.nombre.trim();
  let apellido = (cliente.apellido || '').trim();
  if (!apellido && nombre.includes(' ')) {
    const parts = nombre.split(/\s+/);
    nombre = parts[0];
    apellido = parts.slice(1).join(' ');
  }

  const [result] = await executor.execute(
    `INSERT INTO clientes (nombre, apellido, cedula, direccion, telefono, email)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      apellido,
      cliente.cedula,
      cliente.direccion || null,
      cliente.telefono  || null,
      cliente.correo    || cliente.email || null,
    ]
  );
  return result.insertId;
}

export async function crearMascota(clienteId, mascota, executor = pool) {
  const [result] = await executor.execute(
    `INSERT INTO mascotas (id_cliente, nombre, especie, raza, sexo, fecha_nacimiento, peso, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clienteId,
      mascota.nombre,
      mascota.especie,
      mascota.raza             || null,
      mascota.sexo             || 'Desconocido',
      mascota.fechaNacimiento  || null,
      mascota.pesoKg           || null,
      mascota.color            || null,
    ]
  );
  const mascotaId = result.insertId;

  // Guardar foto de perfil si fue adjuntada o tomada con la cámara
  if (mascota.foto) {
    const fotoUrl = await guardarFotoMascotaEnDisco(mascotaId, mascota.foto);
    await executor.execute('UPDATE mascotas SET foto_url = ? WHERE id_mascota = ?', [fotoUrl, mascotaId]);
  }

  // Aperturar historia clínica automáticamente para la nueva mascota
  try {
    await executor.execute(
      `INSERT INTO historias_clinicas (id_mascota, fecha_apertura, estado, observaciones_generales)
       VALUES (?, CURDATE(), 'Activa', CONCAT('Historia clínica inicial de ', ?))`,
      [mascotaId, mascota.nombre]
    );
  } catch (err) {
    // Si ya existe por algún trigger, continuamos
    console.warn('Historia clínica advertencia:', err.message);
  }

  return mascotaId;
}

export async function listarConMascotas() {
  const [rows] = await pool.execute(
    `SELECT
       c.id_cliente AS id,
       TRIM(CONCAT(c.nombre, ' ', IFNULL(c.apellido, ''))) AS nombre,
       c.cedula,
       c.direccion,
       c.telefono,
       c.email AS correo,
       c.fecha_registro AS created_at,
       m.id_mascota     AS mascota_id,
       m.nombre         AS mascota_nombre,
       m.especie,
       m.raza,
       m.sexo,
       m.fecha_nacimiento,
       m.peso AS peso_kg,
       m.foto_url,
       EXISTS(
         SELECT 1 FROM hospitalizaciones h
         WHERE h.id_mascota = m.id_mascota AND h.estado = 'Activa'
       ) AS hospitalizado,
       EXISTS(
         SELECT 1 FROM citas c
         JOIN estados_cita e ON e.id_estado = c.id_estado
         WHERE c.id_mascota = m.id_mascota
           AND e.nombre_estado IN ('Programada', 'Confirmada', 'En atención')
       ) AS en_seguimiento
     FROM clientes c
     LEFT JOIN mascotas m ON m.id_cliente = c.id_cliente AND m.activo = 1
     WHERE c.activo = 1
     ORDER BY c.nombre ASC`
  );
  return rows;
}
