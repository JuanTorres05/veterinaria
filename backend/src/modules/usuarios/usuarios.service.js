import pool from '../../db/pool.js';
import bcrypt from 'bcryptjs';
import { ConflictError, NotFoundError } from '../../errors/http.errors.js';

export async function listarUsuarios() {
  const [rows] = await pool.execute(
    `SELECT u.id, u.cedula, u.nombre, u.rol_id, r.nombre AS rol, u.activo, u.created_at
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     ORDER BY u.activo DESC, r.id ASC, u.nombre ASC`
  );
  return rows;
}

export async function crearUsuario({ cedula, nombre, password, rol_id }) {
  // Verificar duplicados por cédula
  const [[existente]] = await pool.execute(
    `SELECT id FROM usuarios WHERE cedula = ? LIMIT 1`,
    [cedula]
  );

  if (existente) {
    throw new ConflictError('Ya existe un trabajador registrado con esta cédula.');
  }

  const password_hash = await bcrypt.hash(password, 10);

  const [result] = await pool.execute(
    `INSERT INTO usuarios (cedula, nombre, password_hash, rol_id, activo)
     VALUES (?, ?, ?, ?, 1)`,
    [cedula, nombre, password_hash, rol_id]
  );

  const [[rolRow]] = await pool.execute(`SELECT nombre FROM roles WHERE id = ?`, [rol_id]);

  return {
    id: result.insertId,
    cedula,
    nombre,
    rol_id,
    rol: rolRow ? rolRow.nombre : 'desconocido',
    activo: 1
  };
}

export async function cambiarEstadoUsuario(id, activo) {
  const [[user]] = await pool.execute(`SELECT id FROM usuarios WHERE id = ?`, [id]);
  if (!user) {
    throw new NotFoundError('Trabajador no encontrado.');
  }

  await pool.execute(
    `UPDATE usuarios SET activo = ? WHERE id = ?`,
    [activo ? 1 : 0, id]
  );

  return { message: `Estado del usuario actualizado a ${activo ? 'activo' : 'inactivo'}.` };
}

export async function cambiarPasswordUsuario(id, password) {
  const [[user]] = await pool.execute(`SELECT id FROM usuarios WHERE id = ?`, [id]);
  if (!user) {
    throw new NotFoundError('Trabajador no encontrado.');
  }

  const password_hash = await bcrypt.hash(password, 10);

  await pool.execute(
    `UPDATE usuarios SET password_hash = ? WHERE id = ?`,
    [password_hash, id]
  );

  return { message: 'Contraseña actualizada exitosamente.' };
}
