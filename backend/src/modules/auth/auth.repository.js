import pool from '../../db/pool.js';

export async function buscarUsuarioParaLogin(cedula) {
  const [rows] = await pool.execute(`SELECT u.id, u.nombre, u.password_hash, r.nombre AS rol FROM usuarios u INNER JOIN roles r ON r.id = u.rol_id WHERE u.cedula = ? AND u.activo = 1 LIMIT 1`, [cedula]);
  return rows[0] || null;
}

export async function listarVeterinariosActivos() {
  const [rows] = await pool.execute(`SELECT u.id, u.nombre FROM usuarios u INNER JOIN roles r ON r.id = u.rol_id WHERE r.nombre IN ('veterinario', 'admin') AND u.activo = 1 ORDER BY u.nombre`);
  return rows;
}

export async function buscarUsuarioActivoPorCedula(cedula) {
  const [rows] = await pool.execute('SELECT id, nombre FROM usuarios WHERE cedula = ? AND activo = 1 LIMIT 1', [cedula]);
  return rows[0] || null;
}
