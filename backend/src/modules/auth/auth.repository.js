import pool from '../../db/pool.js';

export async function buscarUsuarioParaLogin(cedula) {
  const [rows] = await pool.execute(`
    SELECT 
      u.id_usuario AS id, 
      u.nombre, 
      u.password_hash, 
      r.nombre_rol AS rol 
    FROM usuarios u 
    INNER JOIN roles r ON r.id_rol = u.id_rol 
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

/**
 * Actualiza el password_hash del usuario identificado por cédula.
 * Retorna el número de filas afectadas (0 si la cédula no existe o está inactiva).
 */
export async function actualizarPasswordPorCedula(cedula, nuevoHash) {
  const [result] = await pool.execute(
    'UPDATE usuarios SET password_hash = ? WHERE cedula = ? AND activo = 1',
    [nuevoHash, cedula]
  );
  return result.affectedRows;
}
