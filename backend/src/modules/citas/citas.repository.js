import pool from '../../db/pool.js';

// Mapeo semántico de estados: la BD almacena 'Programada', 'Confirmada', 'Atendida', 'Cancelada', 'No asistió'
// y el frontend maneja 'pendiente', 'atendida', 'cancelada'.
const selectCitas = `
  SELECT
    c.id_cita          AS id,
    c.fecha_hora,
    c.motivo,
    c.observaciones,
    CASE 
      WHEN e.nombre_estado IN ('Programada', 'Confirmada', 'En atención') THEN 'pendiente'
      WHEN e.nombre_estado = 'Atendida' THEN 'atendida'
      WHEN e.nombre_estado IN ('Cancelada', 'No asistió') THEN 'cancelada'
      ELSE LOWER(e.nombre_estado)
    END AS estado,
    c.fecha_creacion   AS created_at,
    m.id_mascota       AS mascota_id,
    m.nombre           AS mascota_nombre,
    m.especie,
    cl.id_cliente,
    TRIM(CONCAT(cl.nombre, ' ', IFNULL(cl.apellido, ''))) AS cliente_nombre,
    cl.telefono,
    v.id_veterinario   AS veterinario_id,
    u.nombre           AS veterinario_nombre
  FROM citas c
  JOIN mascotas     m  ON m.id_mascota     = c.id_mascota
  JOIN clientes     cl ON cl.id_cliente    = m.id_cliente
  JOIN veterinarios v  ON v.id_veterinario = c.id_veterinario
  JOIN usuarios     u  ON u.id_usuario     = v.id_usuario
  JOIN estados_cita e  ON e.id_estado      = c.id_estado
`;

export async function listar({ fecha, estado }) {
  const conditions = [], params = [];
  if (fecha) {
    conditions.push('DATE(c.fecha_hora) = ?');
    params.push(fecha);
  }
  if (estado) {
    if (estado === 'pendiente') {
      conditions.push("e.nombre_estado IN ('Programada', 'Confirmada', 'En atención')");
    } else if (estado === 'atendida') {
      conditions.push("e.nombre_estado = 'Atendida'");
    } else if (estado === 'cancelada') {
      conditions.push("e.nombre_estado IN ('Cancelada', 'No asistió')");
    } else {
      conditions.push('e.nombre_estado = ?');
      params.push(estado);
    }
  }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute(`${selectCitas}${where} ORDER BY c.fecha_hora ASC`, params);
  return rows;
}

export async function buscarSolapada(id_veterinario, fecha_hora) {
  const [rows] = await pool.execute(
    `SELECT c.id_cita FROM citas c
     JOIN estados_cita e ON e.id_estado = c.id_estado
     WHERE c.id_veterinario = ?
       AND e.nombre_estado NOT IN ('Cancelada', 'No asistió')
       AND c.fecha_hora = ?
     LIMIT 1`,
    [id_veterinario, fecha_hora]
  );
  return rows[0] || null;
}

export async function crear({ mascota_id, usuario_id, fecha_hora, motivo }) {
  // usuario_id que viene del frontend es el id_veterinario seleccionado
  const [result] = await pool.execute(
    `INSERT INTO citas (id_mascota, id_veterinario, id_estado, fecha_hora, motivo)
     VALUES (?, ?, 1, ?, ?)`,
    [mascota_id, usuario_id, fecha_hora, motivo]
  );
  return buscarPorId(result.insertId);
}

export async function actualizarEstado(id, estadoFrontend, notasCancelacion) {
  let targetEstado = 'Programada';
  if (estadoFrontend === 'atendida') targetEstado = 'Atendida';
  else if (estadoFrontend === 'cancelada') targetEstado = 'Cancelada';
  else if (estadoFrontend === 'pendiente') targetEstado = 'Programada';

  const [[estadoRow]] = await pool.execute(
    'SELECT id_estado FROM estados_cita WHERE nombre_estado = ? LIMIT 1',
    [targetEstado]
  );
  if (!estadoRow) return 0;

  const [result] = await pool.execute(
    'UPDATE citas SET id_estado = ?, observaciones = COALESCE(?, observaciones) WHERE id_cita = ?',
    [estadoRow.id_estado, notasCancelacion || null, id]
  );
  return result.affectedRows;
}

export async function buscarPorId(id) {
  const [rows] = await pool.execute(`${selectCitas} WHERE c.id_cita = ?`, [id]);
  return rows[0] || null;
}

export async function eliminar(id) {
  const [result] = await pool.execute('DELETE FROM citas WHERE id_cita = ?', [id]);
  return result.affectedRows;
}

export async function obtenerEstadisticas() {
  const [[{ clientes }]]     = await pool.execute('SELECT COUNT(*) AS clientes     FROM clientes     WHERE activo = 1');
  const [[{ mascotas }]]     = await pool.execute('SELECT COUNT(*) AS mascotas     FROM mascotas     WHERE activo = 1');
  const [[{ citasHoy }]]     = await pool.execute('SELECT COUNT(*) AS citasHoy     FROM citas        WHERE DATE(fecha_hora) = CURDATE()');
  const [[{ veterinarios }]] = await pool.execute('SELECT COUNT(*) AS veterinarios FROM veterinarios WHERE activo = 1');
  return { clientes, mascotas, citasHoy, veterinarios };
}
