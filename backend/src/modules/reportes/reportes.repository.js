import pool from '../../db/pool.js';

export async function obtenerResumen() {
  const [[{ totalClientes }]]   = await pool.execute('SELECT COUNT(*) AS totalClientes FROM clientes WHERE activo = 1');
  const [[{ totalMascotas }]]   = await pool.execute('SELECT COUNT(*) AS totalMascotas FROM mascotas WHERE activo = 1');
  const [[{ totalCitas }]]      = await pool.execute('SELECT COUNT(*) AS totalCitas FROM citas');
  const [[{ citasAtendidas }]]  = await pool.execute("SELECT COUNT(*) AS citasAtendidas  FROM citas c JOIN estados_cita e ON e.id_estado = c.id_estado WHERE e.nombre_estado = 'Atendida'");
  const [[{ citasPendientes }]] = await pool.execute("SELECT COUNT(*) AS citasPendientes FROM citas c JOIN estados_cita e ON e.id_estado = c.id_estado WHERE e.nombre_estado IN ('Programada','Confirmada')");
  const [[{ citasCanceladas }]] = await pool.execute("SELECT COUNT(*) AS citasCanceladas FROM citas c JOIN estados_cita e ON e.id_estado = c.id_estado WHERE e.nombre_estado = 'Cancelada'");
  const [[{ totalHistorial }]]  = await pool.execute('SELECT COUNT(*) AS totalHistorial FROM historias_clinicas');
  const [topEspecies] = await pool.execute('SELECT especie, COUNT(*) AS total FROM mascotas WHERE activo = 1 GROUP BY especie ORDER BY total DESC LIMIT 5');
  const [topVet] = await pool.execute(`
    SELECT u.nombre AS veterinario, COUNT(*) AS totalAtendidas
    FROM citas c
    JOIN veterinarios v  ON v.id_veterinario = c.id_veterinario
    JOIN usuarios     u  ON u.id_usuario     = v.id_usuario
    JOIN estados_cita e  ON e.id_estado      = c.id_estado
    WHERE e.nombre_estado = 'Atendida'
    GROUP BY c.id_veterinario
    ORDER BY totalAtendidas DESC
    LIMIT 1
  `);
  return { totalClientes, totalMascotas, totalCitas, citasAtendidas, citasPendientes, citasCanceladas, totalHistorial, topEspecies, topVeterinario: topVet[0] || null };
}

export async function obtenerCitasPorDia(dias) {
  const [rows] = await pool.execute(`
    SELECT
      DATE(c.fecha_hora) AS fecha,
      COUNT(*) AS total,
      SUM(e.nombre_estado = 'Atendida')  AS atendidas,
      SUM(e.nombre_estado IN ('Programada','Confirmada')) AS pendientes,
      SUM(e.nombre_estado = 'Cancelada') AS canceladas
    FROM citas c
    JOIN estados_cita e ON e.id_estado = c.id_estado
    WHERE c.fecha_hora >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(c.fecha_hora)
    ORDER BY fecha ASC
  `, [dias]);
  return rows;
}

export async function obtenerCitasPorDiaSemana() {
  const [rows] = await pool.execute(
    'SELECT DAYOFWEEK(fecha_hora) AS diaSemana, COUNT(*) AS total FROM citas GROUP BY DAYOFWEEK(fecha_hora) ORDER BY diaSemana ASC'
  );
  return rows;
}
