import pool from '../../db/pool.js';

export async function listarPorCliente(clienteId) {
  const [rows] = await pool.execute(`SELECT id, cliente_id, nombre, especie, raza, sexo, fecha_nacimiento, peso_kg, color, foto_url, created_at FROM mascotas WHERE cliente_id = ? ORDER BY nombre ASC`, [clienteId]);
  return rows;
}

export async function buscarFicha(id) {
  const [rows] = await pool.execute(`SELECT m.id, m.nombre, m.especie, m.raza, m.sexo, m.fecha_nacimiento, m.peso_kg, m.color, m.foto_url, m.created_at, c.id AS cliente_id, c.nombre AS cliente_nombre, c.cedula AS cliente_cedula, c.telefono AS cliente_telefono, c.correo AS cliente_correo, c.direccion AS cliente_direccion FROM mascotas m INNER JOIN clientes c ON c.id = m.cliente_id WHERE m.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function listarHistorial(mascotaId) {
  const [rows] = await pool.execute(`SELECT h.id, h.fecha, h.motivo, h.diagnostico, h.tratamiento, h.notas, h.created_at, u.nombre AS veterinario_nombre FROM historial_clinico h INNER JOIN usuarios u ON u.id = h.usuario_id WHERE h.mascota_id = ? ORDER BY h.fecha DESC`, [mascotaId]);
  return rows;
}

export async function listarCitas(mascotaId) {
  const [rows] = await pool.execute(`SELECT c.id, c.fecha_hora, c.motivo, c.estado, c.duracion_min, c.notas_cancelacion, u.nombre AS veterinario_nombre FROM citas c LEFT JOIN usuarios u ON u.id = c.usuario_id WHERE c.mascota_id = ? ORDER BY c.fecha_hora DESC`, [mascotaId]);
  return rows;
}

export async function crearHistorial({ mascota_id, usuario_id, fecha, motivo, diagnostico, tratamiento, notas }) {
  const [result] = await pool.execute(`INSERT INTO historial_clinico (mascota_id, usuario_id, fecha, motivo, diagnostico, tratamiento, notas) VALUES (?, ?, ?, ?, ?, ?, ?)`, [mascota_id, usuario_id, fecha, motivo, diagnostico, tratamiento, notas || null]);
  const [rows] = await pool.execute(`SELECT h.id, h.fecha, h.motivo, h.diagnostico, h.tratamiento, h.notas, h.created_at, u.nombre AS veterinario_nombre FROM historial_clinico h INNER JOIN usuarios u ON u.id = h.usuario_id WHERE h.id = ? LIMIT 1`, [result.insertId]);
  return rows[0];
}
