import pool from '../../db/pool.js';

const selectCitas = `SELECT c.id, c.fecha_hora, c.motivo, c.duracion_min, c.notas_cancelacion, c.estado, c.created_at, m.id AS mascota_id, m.nombre AS mascota_nombre, m.especie, c.usuario_id, cl.nombre AS cliente_nombre, cl.telefono, u.nombre AS veterinario_nombre FROM citas c JOIN mascotas m ON m.id = c.mascota_id JOIN clientes cl ON cl.id = m.cliente_id JOIN usuarios u ON u.id = c.usuario_id`;

export async function listar({ fecha, estado }) {
  const conditions = [], params = [];
  if (fecha) { conditions.push('DATE(c.fecha_hora) = ?'); params.push(fecha); }
  if (estado) { conditions.push('c.estado = ?'); params.push(estado); }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute(`${selectCitas}${where} ORDER BY c.fecha_hora ASC`, params);
  return rows;
}

export async function buscarSolapada(usuario_id, fecha_hora) {
  const [rows] = await pool.execute(
    `SELECT id FROM citas 
     WHERE usuario_id = ? 
       AND estado != 'cancelada' 
       AND fecha_hora = ? 
     LIMIT 1`,
    [usuario_id, fecha_hora]
  );
  return rows[0] || null;
}

export async function crear({ mascota_id, usuario_id, fecha_hora, motivo, duracion_min }) {
  const [result] = await pool.execute(`INSERT INTO citas (mascota_id, usuario_id, fecha_hora, motivo, duracion_min, estado) VALUES (?, ?, ?, ?, ?, 'pendiente')`, [mascota_id, usuario_id, fecha_hora, motivo, duracion_min]);
  return buscarPorId(result.insertId);
}

export async function actualizarEstado(id, estado, notasCancelacion) {
  const [result] = await pool.execute('UPDATE citas SET estado = ?, notas_cancelacion = ? WHERE id = ?', [estado, notasCancelacion, id]);
  return result.affectedRows;
}

export async function buscarPorId(id) {
  const [rows] = await pool.execute(`${selectCitas} WHERE c.id = ?`, [id]);
  return rows[0] || null;
}

export async function eliminar(id) {
  const [result] = await pool.execute('DELETE FROM citas WHERE id = ?', [id]);
  return result.affectedRows;
}

export async function obtenerEstadisticas() {
  const [[{ clientes }]] = await pool.execute('SELECT COUNT(*) AS clientes FROM clientes');
  const [[{ mascotas }]] = await pool.execute('SELECT COUNT(*) AS mascotas FROM mascotas');
  const [[{ citasHoy }]] = await pool.execute('SELECT COUNT(*) AS citasHoy FROM citas WHERE DATE(fecha_hora) = CURDATE()');
  const [[{ veterinarios }]] = await pool.execute(`SELECT COUNT(*) AS veterinarios FROM usuarios u INNER JOIN roles r ON r.id = u.rol_id WHERE r.nombre = 'veterinario' AND u.activo = 1`);
  return { clientes, mascotas, citasHoy, veterinarios };
}
