import pool from '../../db/pool.js';
import { NotFoundError } from '../../errors/http.errors.js';

// Query base reutilizable para citas con join completo
const CITA_SELECT = `
    SELECT 
      c.id, 
      c.fecha_hora, 
      c.motivo,
      c.duracion_min,
      c.notas_cancelacion,
      c.estado, 
      c.created_at, 
      m.id AS mascota_id,
      m.nombre AS mascota_nombre, 
      m.especie, 
      c.usuario_id,
      cl.nombre AS cliente_nombre, 
      cl.telefono, 
      u.nombre AS veterinario_nombre
    FROM citas c
    JOIN mascotas m ON m.id = c.mascota_id
    JOIN clientes cl ON cl.id = m.cliente_id
    JOIN usuarios u ON u.id = c.usuario_id
`;

export async function listarCitas({ fecha, estado }) {
  let query = CITA_SELECT;
  
  const conditions = [];
  const params = [];

  if (fecha) {
    conditions.push('DATE(c.fecha_hora) = ?');
    params.push(fecha);
  }

  if (estado) {
    conditions.push('c.estado = ?');
    params.push(estado);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY c.fecha_hora ASC';

  const [rows] = await pool.execute(query, params);
  return rows;
}

export async function crearCita({ mascota_id, usuario_id, fecha_hora, motivo, duracion_min }) {
  const duracion = duracion_min ? Number(duracion_min) : 30;

  const [result] = await pool.execute(
    `INSERT INTO citas (mascota_id, usuario_id, fecha_hora, motivo, duracion_min, estado)
     VALUES (?, ?, ?, ?, ?, 'pendiente')`,
    [mascota_id, usuario_id, fecha_hora, motivo, duracion]
  );

  const newId = result.insertId;

  const [rows] = await pool.execute(CITA_SELECT + ' WHERE c.id = ?', [newId]);
  return rows[0];
}

export async function cambiarEstadoCita(id, estado, notas_cancelacion) {
  // Si se cancela, guardamos las notas de cancelación
  if (estado === 'cancelada' && notas_cancelacion) {
    await pool.execute(
      'UPDATE citas SET estado = ?, notas_cancelacion = ? WHERE id = ?',
      [estado, notas_cancelacion, id]
    );
  } else {
    const [result] = await pool.execute(
      'UPDATE citas SET estado = ? WHERE id = ?',
      [estado, id]
    );

    if (result.affectedRows === 0) {
      throw new NotFoundError('La cita especificada no existe.');
    }
  }

  const [rows] = await pool.execute(CITA_SELECT + ' WHERE c.id = ?', [id]);

  if (rows.length === 0) {
    throw new NotFoundError('La cita especificada no existe.');
  }

  return rows[0];
}

export async function eliminarCita(id) {
  const [result] = await pool.execute(
    'DELETE FROM citas WHERE id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    throw new NotFoundError('La cita especificada no existe.');
  }

  return true;
}

export async function obtenerStatsDashboard() {
  const [[{ clientes }]] = await pool.execute('SELECT COUNT(*) AS clientes FROM clientes');
  const [[{ mascotas }]] = await pool.execute('SELECT COUNT(*) AS mascotas FROM mascotas');
  const [[{ citasHoy }]] = await pool.execute('SELECT COUNT(*) AS citasHoy FROM citas WHERE DATE(fecha_hora) = CURDATE()');
  const [[{ veterinarios }]] = await pool.execute(
    `SELECT COUNT(*) AS veterinarios FROM usuarios u 
     INNER JOIN roles r ON r.id = u.rol_id 
     WHERE r.nombre = 'veterinario' AND u.activo = 1`
  );
  
  return { clientes, mascotas, citasHoy, veterinarios };
}
