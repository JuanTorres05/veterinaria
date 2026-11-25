import pool from '../../db/pool.js';
import { withTransaction } from '../../db/transaction.js';

export async function buscarUsuarioParaLogin(cedula) {
  const [rows] = await pool.execute(`
    SELECT 
      u.id_usuario AS id, 
      u.nombre, 
      u.password_hash, 
      r.nombre_rol AS rol,
      cl.id_cliente AS cliente_id
    FROM usuarios u 
    INNER JOIN roles r ON r.id_rol = u.id_rol 
    LEFT JOIN clientes cl ON cl.id_usuario = u.id_usuario AND cl.activo = 1
    WHERE u.cedula = ? AND u.activo = 1 
    LIMIT 1
  `, [cedula]);
  return rows[0] || null;
}

export async function listarVeterinariosActivos() {
  const [rows] = await pool.execute(`
    SELECT 
      v.id_veterinario AS id, 
      u.nombre, 
      v.especialidad 
    FROM veterinarios v 
    JOIN usuarios u ON u.id_usuario = v.id_usuario 
    WHERE v.activo = 1 AND u.activo = 1 
    ORDER BY u.nombre ASC
  `);
  return rows;
}

export async function buscarUsuarioActivoPorCedula(cedula) {
  const [rows] = await pool.execute(
    'SELECT id_usuario AS id, nombre FROM usuarios WHERE cedula = ? AND activo = 1 LIMIT 1',
    [cedula]
  );
  return rows[0] || null;
}

export async function actualizarPasswordPorCedula(cedula, nuevoHash) {
  const [result] = await pool.execute(
    'UPDATE usuarios SET password_hash = ? WHERE cedula = ? AND activo = 1',
    [nuevoHash, cedula]
  );
  return result.affectedRows;
}

export async function buscarClientePorCedula(cedula) {
  const [rows] = await pool.execute(`
    SELECT
      c.id_cliente,
      c.id_usuario,
      c.nombre,
      c.apellido,
      c.email,
      c.telefono,
      c.direccion,
      c.cedula,
      (SELECT COUNT(*) FROM mascotas m WHERE m.id_cliente = c.id_cliente AND m.activo = 1) AS total_mascotas
    FROM clientes c
    WHERE c.cedula = ? AND c.activo = 1
    LIMIT 1
  `, [cedula]);
  return rows[0] || null;
}

export async function buscarRolPorNombre(nombreRol) {
  const [rows] = await pool.execute(
    'SELECT id_rol FROM roles WHERE nombre_rol = ? LIMIT 1',
    [nombreRol]
  );
  return rows[0]?.id_rol || null;
}

export async function buscarUsuarioPorEmailOCedula(email, cedula) {
  const [rows] = await pool.execute(
    'SELECT id_usuario, email, cedula FROM usuarios WHERE email = ? OR cedula = ? LIMIT 1',
    [email, cedula]
  );
  return rows[0] || null;
}

export async function activarCuentaPropietario({
  clienteId,
  nombreCompleto,
  email,
  cedula,
  passwordHash,
  rolId,
}) {
  return withTransaction(async (conn) => {
    const [uRes] = await conn.execute(
      `INSERT INTO usuarios (id_rol, nombre, email, password_hash, activo, cedula)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [rolId, nombreCompleto, email, passwordHash, cedula]
    );
    const usuarioId = uRes.insertId;

    await conn.execute(
      'UPDATE clientes SET id_usuario = ?, email = COALESCE(email, ?) WHERE id_cliente = ?',
      [usuarioId, email, clienteId]
    );

    return { usuarioId, clienteId };
  });
}

export async function registrarNuevoPropietario({
  nombre,
  apellido,
  nombreCompleto,
  cedula,
  telefono,
  correo,
  direccion,
  passwordHash,
  rolId,
  mascota,
}) {
  return withTransaction(async (conn) => {
    const [uRes] = await conn.execute(
      `INSERT INTO usuarios (id_rol, nombre, email, password_hash, activo, cedula)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [rolId, nombreCompleto, correo, passwordHash, cedula]
    );
    const usuarioId = uRes.insertId;

    const [cRes] = await conn.execute(
      `INSERT INTO clientes (id_usuario, nombre, apellido, email, telefono, direccion, activo, cedula)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [usuarioId, nombre, apellido, correo, telefono, direccion || null, cedula]
    );
    const clienteId = cRes.insertId;

    if (mascota && mascota.nombre) {
      const [mRes] = await conn.execute(
        `INSERT INTO mascotas (id_cliente, nombre, especie, raza, sexo, fecha_nacimiento, peso, color, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          clienteId,
          mascota.nombre,
          mascota.especie || 'Perro',
          mascota.raza || null,
          mascota.sexo || 'Desconocido',
          mascota.fechaNacimiento || null,
          mascota.pesoKg ? Number(mascota.pesoKg) : null,
          mascota.color || null,
        ]
      );
      await conn.execute(
        `INSERT INTO historias_clinicas (id_mascota, fecha_apertura, estado, observaciones_generales)
         VALUES (?, CURDATE(), 'Activa', ?)`,
        [mRes.insertId, `Historia clínica de ${mascota.nombre}. Registrada desde Portal del Propietario.`]
      );
    }

    return { usuarioId, clienteId };
  });
}
