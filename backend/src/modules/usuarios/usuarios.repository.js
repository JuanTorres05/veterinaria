import pool from '../../db/pool.js';

export async function listar() { const [rows] = await pool.execute(`SELECT u.id, u.cedula, u.nombre, u.rol_id, r.nombre AS rol, u.activo, u.created_at FROM usuarios u INNER JOIN roles r ON r.id = u.rol_id ORDER BY u.activo DESC, r.id ASC, u.nombre ASC`); return rows; }
export async function buscarPorCedula(cedula) { const [rows] = await pool.execute('SELECT id FROM usuarios WHERE cedula = ? LIMIT 1', [cedula]); return rows[0] || null; }
export async function crear({ cedula, nombre, password_hash, rol_id }) { const [result] = await pool.execute('INSERT INTO usuarios (cedula, nombre, password_hash, rol_id, activo) VALUES (?, ?, ?, ?, 1)', [cedula, nombre, password_hash, rol_id]); return result.insertId; }
export async function buscarRol(id) { const [rows] = await pool.execute('SELECT nombre FROM roles WHERE id = ?', [id]); return rows[0] || null; }
export async function existe(id) { const [rows] = await pool.execute('SELECT id FROM usuarios WHERE id = ?', [id]); return Boolean(rows[0]); }
export async function actualizarEstado(id, activo) { await pool.execute('UPDATE usuarios SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]); }
export async function actualizarPassword(id, passwordHash) { await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [passwordHash, id]); }
