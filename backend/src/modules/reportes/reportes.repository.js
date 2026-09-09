import pool from '../../db/pool.js';

export async function obtenerResumen() {
  const [[{ totalClientes }]] = await pool.execute('SELECT COUNT(*) AS totalClientes FROM clientes');
  const [[{ totalMascotas }]] = await pool.execute('SELECT COUNT(*) AS totalMascotas FROM mascotas');
  const [[{ totalCitas }]] = await pool.execute('SELECT COUNT(*) AS totalCitas FROM citas');
  const [[{ citasAtendidas }]] = await pool.execute("SELECT COUNT(*) AS citasAtendidas FROM citas WHERE estado = 'atendida'");
  const [[{ citasPendientes }]] = await pool.execute("SELECT COUNT(*) AS citasPendientes FROM citas WHERE estado = 'pendiente'");
  const [[{ citasCanceladas }]] = await pool.execute("SELECT COUNT(*) AS citasCanceladas FROM citas WHERE estado = 'cancelada'");
  const [[{ totalHistorial }]] = await pool.execute('SELECT COUNT(*) AS totalHistorial FROM historial_clinico');
  const [topEspecies] = await pool.execute('SELECT especie, COUNT(*) AS total FROM mascotas GROUP BY especie ORDER BY total DESC LIMIT 5');
  const [topVet] = await pool.execute(`SELECT u.nombre AS veterinario, COUNT(*) AS totalAtendidas FROM citas c JOIN usuarios u ON u.id = c.usuario_id WHERE c.estado = 'atendida' GROUP BY c.usuario_id ORDER BY totalAtendidas DESC LIMIT 1`);
  return { totalClientes, totalMascotas, totalCitas, citasAtendidas, citasPendientes, citasCanceladas, totalHistorial, topEspecies, topVeterinario: topVet[0] || null };
}

export async function obtenerCitasPorDia(dias) {
  const [rows] = await pool.execute(`SELECT DATE(fecha_hora) AS fecha, COUNT(*) AS total, SUM(estado = 'atendida') AS atendidas, SUM(estado = 'pendiente') AS pendientes, SUM(estado = 'cancelada') AS canceladas FROM citas WHERE fecha_hora >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY DATE(fecha_hora) ORDER BY fecha ASC`, [dias]);
  return rows;
}

export async function obtenerCitasPorDiaSemana() {
  const [rows] = await pool.execute('SELECT DAYOFWEEK(fecha_hora) AS diaSemana, COUNT(*) AS total FROM citas GROUP BY DAYOFWEEK(fecha_hora) ORDER BY diaSemana ASC');
  return rows;
}
