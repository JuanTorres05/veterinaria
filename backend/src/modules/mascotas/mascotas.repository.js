import pool from '../../db/pool.js';

export async function listarPorCliente(clienteId) {
  const [rows] = await pool.execute(`
    SELECT 
      id_mascota AS id, 
      id_cliente AS cliente_id, 
      nombre, 
      especie, 
      raza, 
      sexo, 
      fecha_nacimiento, 
      peso AS peso_kg, 
      color, 
      microchip, 
      observaciones
    FROM mascotas 
    WHERE id_cliente = ? AND activo = 1 
    ORDER BY nombre ASC
  `, [clienteId]);
  return rows;
}

export async function buscarFicha(id) {
  const [rows] = await pool.execute(`
    SELECT 
      m.id_mascota AS id, 
      m.nombre, 
      m.especie, 
      m.raza, 
      m.sexo, 
      m.fecha_nacimiento, 
      m.peso AS peso_kg, 
      m.color, 
      m.microchip, 
      m.observaciones, 
      c.id_cliente AS cliente_id, 
      TRIM(CONCAT(c.nombre, ' ', IFNULL(c.apellido, ''))) AS cliente_nombre, 
      c.cedula AS cliente_cedula, 
      c.telefono AS cliente_telefono, 
      c.email AS cliente_correo, 
      c.direccion AS cliente_direccion 
    FROM mascotas m 
    INNER JOIN clientes c ON c.id_cliente = m.id_cliente 
    WHERE m.id_mascota = ? 
    LIMIT 1
  `, [id]);
  return rows[0] || null;
}

export async function listarHistorial(mascotaId) {
  const [rows] = await pool.execute(`
    SELECT 
      cm.id_consulta AS id, 
      cm.fecha_consulta AS fecha, 
      cm.sintomas AS motivo, 
      cm.diagnostico, 
      cm.tratamiento_resumen AS tratamiento, 
      cm.observaciones AS notas, 
      cm.fecha_consulta AS created_at, 
      u.nombre AS veterinario_nombre 
    FROM consultas_medicas cm 
    JOIN historias_clinicas hc ON hc.id_historia = cm.id_historia 
    JOIN veterinarios v ON v.id_veterinario = cm.id_veterinario 
    JOIN usuarios u ON u.id_usuario = v.id_usuario 
    WHERE hc.id_mascota = ? 
    ORDER BY cm.fecha_consulta DESC
  `, [mascotaId]);
  return rows;
}

export async function listarCitas(mascotaId) {
  const [rows] = await pool.execute(`
    SELECT 
      c.id_cita AS id, 
      c.fecha_hora, 
      c.motivo, 
      CASE 
        WHEN e.nombre_estado IN ('Programada', 'Confirmada', 'En atención') THEN 'pendiente'
        WHEN e.nombre_estado = 'Atendida' THEN 'atendida'
        WHEN e.nombre_estado IN ('Cancelada', 'No asistió') THEN 'cancelada'
        ELSE LOWER(e.nombre_estado)
      END AS estado, 
      c.observaciones AS notas_cancelacion, 
      u.nombre AS veterinario_nombre 
    FROM citas c 
    JOIN estados_cita e ON e.id_estado = c.id_estado 
    JOIN veterinarios v ON v.id_veterinario = c.id_veterinario 
    JOIN usuarios u ON u.id_usuario = v.id_usuario 
    WHERE c.id_mascota = ? 
    ORDER BY c.fecha_hora DESC
  `, [mascotaId]);
  return rows;
}

export async function crearHistorial({ mascota_id, usuario_id, fecha, motivo, diagnostico, tratamiento, notas }) {
  // 1. Asegurar historia clínica para la mascota
  let [[historia]] = await pool.execute(
    'SELECT id_historia FROM historias_clinicas WHERE id_mascota = ? LIMIT 1',
    [mascota_id]
  );
  if (!historia) {
    const [hRes] = await pool.execute(
      `INSERT INTO historias_clinicas (id_mascota, fecha_apertura, estado, observaciones_generales) 
       VALUES (?, CURDATE(), 'Activa', 'Historia clínica aperturada en consulta')`,
      [mascota_id]
    );
    historia = { id_historia: hRes.insertId };
  }

  // 2. Obtener id_veterinario a partir de usuario_id
  let [[vet]] = await pool.execute(
    'SELECT id_veterinario FROM veterinarios WHERE id_usuario = ? LIMIT 1',
    [usuario_id]
  );
  if (!vet) {
    // Si el usuario actual es admin u otro rol sin fila en veterinarios, tomar el primer veterinario activo
    [[vet]] = await pool.execute('SELECT id_veterinario FROM veterinarios WHERE activo = 1 LIMIT 1');
  }
  const idVeterinario = vet ? vet.id_veterinario : 1;

  // 3. Insertar en consultas_medicas
  const [result] = await pool.execute(`
    INSERT INTO consultas_medicas (id_historia, id_veterinario, fecha_consulta, sintomas, diagnostico, tratamiento_resumen, observaciones) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    historia.id_historia,
    idVeterinario,
    fecha,
    motivo,
    diagnostico,
    tratamiento,
    notas || null
  ]);

  // 4. Retornar registro formateado
  const [rows] = await pool.execute(`
    SELECT 
      cm.id_consulta AS id, 
      cm.fecha_consulta AS fecha, 
      cm.sintomas AS motivo, 
      cm.diagnostico, 
      cm.tratamiento_resumen AS tratamiento, 
      cm.observaciones AS notas, 
      cm.fecha_consulta AS created_at, 
      u.nombre AS veterinario_nombre 
    FROM consultas_medicas cm 
    JOIN veterinarios v ON v.id_veterinario = cm.id_veterinario 
    JOIN usuarios u ON u.id_usuario = v.id_usuario 
    WHERE cm.id_consulta = ? 
    LIMIT 1
  `, [result.insertId]);

  return rows[0];
}
