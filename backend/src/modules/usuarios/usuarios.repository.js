import pool from '../../db/pool.js';

const ROL_MAP = {
  'Administrador': 'admin',
  'Recepcionista':  'recepcionista',
  'Veterinario':    'veterinario',
};

export async function listar() {
  const [rows] = await pool.execute(`
    SELECT 
      u.id_usuario AS id, 
      u.cedula, 
      u.nombre, 
      u.email, 
      u.id_rol AS rol_id, 
      r.nombre_rol AS rol_bd, 
      u.activo, 
      u.fecha_creacion AS created_at 
    FROM usuarios u 
    INNER JOIN roles r ON r.id_rol = u.id_rol 
    ORDER BY u.activo DESC, r.id_rol ASC, u.nombre ASC
  `);

  return rows.map(u => ({
    ...u,
    rol: ROL_MAP[u.rol_bd] || u.rol_bd.toLowerCase()
  }));
}

export async function buscarPorCedula(cedula) {
  const [rows] = await pool.execute('SELECT id_usuario AS id FROM usuarios WHERE cedula = ? LIMIT 1', [cedula]);
  return rows[0] || null;
}

export async function crear({ cedula, nombre, password_hash, rol_id, email }) {
  const correoFinal = email || `user_${cedula}@datavet.local`;
  const [result] = await pool.execute(
    'INSERT INTO usuarios (cedula, nombre, email, password_hash, id_rol, activo) VALUES (?, ?, ?, ?, ?, 1)',
    [cedula, nombre, correoFinal, password_hash, rol_id]
  );
  const nuevoId = result.insertId;

  // Si el rol creado es Veterinario (id_rol = 3), registrarlo también en la tabla veterinarios
  if (Number(rol_id) === 3) {
    try {
      await pool.execute(
        `INSERT INTO veterinarios (id_usuario, colegiado, especialidad, tarjeta_profesional, activo)
         VALUES (?, CONCAT('COL-', ?), 'Medicina General', CONCAT('TP-', ?), 1)`,
        [nuevoId, cedula, cedula]
      );
    } catch (err) {
      console.warn('Advertencia al vincular veterinario:', err.message);
    }
  }

  return nuevoId;
}

export async function buscarRol(id_rol) {
  const [rows] = await pool.execute('SELECT id_rol, nombre_rol AS nombre FROM roles WHERE id_rol = ?', [id_rol]);
  return rows[0] || null;
}

export async function existe(id_usuario) {
  const [rows] = await pool.execute('SELECT id_usuario AS id FROM usuarios WHERE id_usuario = ?', [id_usuario]);
  return Boolean(rows[0]);
}

export async function actualizarEstado(id_usuario, activo) {
  await pool.execute('UPDATE usuarios SET activo = ? WHERE id_usuario = ?', [activo ? 1 : 0, id_usuario]);
  // Si tiene perfil de veterinario, sincronizar también
  await pool.execute('UPDATE veterinarios SET activo = ? WHERE id_usuario = ?', [activo ? 1 : 0, id_usuario]);
}

export async function actualizarPassword(id_usuario, passwordHash) {
  await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [passwordHash, id_usuario]);
}
