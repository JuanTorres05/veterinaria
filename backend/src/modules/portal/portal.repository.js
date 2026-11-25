import pool from '../../db/pool.js';
import { withTransaction } from '../../db/transaction.js';

export async function obtenerPerfilCliente(clienteId) {
  const [rows] = await pool.execute(
    `SELECT
      c.id_cliente AS id,
      c.id_usuario,
      TRIM(CONCAT(c.nombre, ' ', IFNULL(c.apellido, ''))) AS nombre_completo,
      c.nombre,
      c.apellido,
      c.cedula,
      c.email AS correo,
      c.telefono,
      c.direccion,
      c.fecha_registro
    FROM clientes c
    WHERE c.id_cliente = ? AND c.activo = 1
    LIMIT 1`,
    [clienteId]
  );
  return rows[0] || null;
}

export async function actualizarPerfilCliente(clienteId, usuarioId, { telefono, correo, direccion }) {
  return withTransaction(async (conn) => {
    await conn.execute(
      `UPDATE clientes
       SET telefono = ?, email = ?, direccion = ?
       WHERE id_cliente = ? AND activo = 1`,
      [telefono, correo, direccion || null, clienteId]
    );
    if (usuarioId) {
      await conn.execute(
        'UPDATE usuarios SET email = ? WHERE id_usuario = ? AND activo = 1',
        [correo, usuarioId]
      );
    }
  });
}

export async function listarMascotasCliente(clienteId) {
  const [rows] = await pool.execute(
    `SELECT
      m.id_mascota AS id,
      m.nombre,
      m.especie,
      m.raza,
      m.sexo,
      m.fecha_nacimiento AS fechaNacimiento,
      m.peso AS pesoKg,
      m.color,
      m.microchip,
      m.observaciones,
      m.foto_url AS fotoUrl,
      (SELECT COUNT(*) FROM consultas_medicas cm
         JOIN historias_clinicas hc ON hc.id_historia = cm.id_historia
         WHERE hc.id_mascota = m.id_mascota) AS totalConsultas,
      (SELECT COUNT(*) FROM hospitalizaciones h
         WHERE h.id_mascota = m.id_mascota AND h.estado = 'Activa') AS hospitalizacionActiva
    FROM mascotas m
    WHERE m.id_cliente = ? AND m.activo = 1
    ORDER BY m.nombre ASC`,
    [clienteId]
  );
  return rows;
}

export async function perteneceMascotaACliente(mascotaId, clienteId) {
  const [rows] = await pool.execute(
    'SELECT id_mascota FROM mascotas WHERE id_mascota = ? AND id_cliente = ? AND activo = 1 LIMIT 1',
    [mascotaId, clienteId]
  );
  return rows.length > 0;
}

export async function crearMascotaCliente(clienteId, data) {
  return withTransaction(async (conn) => {
    const peso = data.pesoKg !== '' && data.pesoKg !== null && data.pesoKg !== undefined
      ? Number(data.pesoKg)
      : null;

    const [mRes] = await conn.execute(
      `INSERT INTO mascotas
        (id_cliente, nombre, especie, raza, sexo, fecha_nacimiento, peso, color, observaciones, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        clienteId,
        data.nombre,
        data.especie,
        data.raza || null,
        data.sexo || 'Desconocido',
        data.fechaNacimiento || null,
        peso,
        data.color || null,
        data.observaciones || null,
      ]
    );
    const mascotaId = mRes.insertId;

    await conn.execute(
      `INSERT INTO historias_clinicas (id_mascota, fecha_apertura, estado, observaciones_generales)
       VALUES (?, CURDATE(), 'Activa', ?)`,
      [mascotaId, `Historia clínica de ${data.nombre}. Registrada desde Portal del Propietario.`]
    );

    return mascotaId;
  });
}

export async function listarCitasCliente(clienteId) {
  const [rows] = await pool.execute(
    `SELECT
      c.id_cita AS id,
      c.fecha_hora,
      c.motivo,
      c.observaciones,
      CASE
        WHEN e.nombre_estado IN ('Programada', 'Confirmada', 'En atención') THEN 'pendiente'
        WHEN e.nombre_estado = 'Atendida' THEN 'atendida'
        WHEN e.nombre_estado IN ('Cancelada', 'No asistió') THEN 'cancelada'
        ELSE LOWER(e.nombre_estado)
      END AS estado,
      e.nombre_estado AS estado_detalle,
      m.id_mascota AS mascota_id,
      m.nombre AS mascota_nombre,
      m.especie,
      m.foto_url AS mascota_foto_url,
      v.id_veterinario AS veterinario_id,
      u.nombre AS veterinario_nombre,
      v.especialidad AS veterinario_especialidad
    FROM citas c
    INNER JOIN mascotas m ON m.id_mascota = c.id_mascota
    INNER JOIN veterinarios v ON v.id_veterinario = c.id_veterinario
    INNER JOIN usuarios u ON u.id_usuario = v.id_usuario
    INNER JOIN estados_cita e ON e.id_estado = c.id_estado
    WHERE m.id_cliente = ?
    ORDER BY c.fecha_hora DESC`,
    [clienteId]
  );
  return rows;
}

export async function obtenerCitaDeCliente(citaId, clienteId) {
  const [rows] = await pool.execute(
    `SELECT
      c.id_cita AS id,
      c.fecha_hora,
      c.id_mascota AS mascota_id,
      e.nombre_estado AS estado_detalle
    FROM citas c
    INNER JOIN mascotas m ON m.id_mascota = c.id_mascota
    INNER JOIN estados_cita e ON e.id_estado = c.id_estado
    WHERE c.id_cita = ? AND m.id_cliente = ?
    LIMIT 1`,
    [citaId, clienteId]
  );
  return rows[0] || null;
}

export async function listarHospitalizacionesActivasCliente(clienteId) {
  const [rows] = await pool.execute(
    `SELECT
      h.id_hospitalizacion AS id,
      h.id_mascota AS mascota_id,
      m.nombre AS mascota_nombre,
      m.especie,
      m.foto_url AS mascota_foto_url,
      h.fecha_ingreso,
      h.motivo,
      h.tratamientos_realizados,
      h.observaciones,
      h.estado,
      u.nombre AS veterinario_nombre
    FROM hospitalizaciones h
    INNER JOIN mascotas m ON m.id_mascota = h.id_mascota
    INNER JOIN veterinarios v ON v.id_veterinario = h.id_veterinario
    INNER JOIN usuarios u ON u.id_usuario = v.id_usuario
    WHERE m.id_cliente = ? AND h.estado = 'Activa'
    ORDER BY h.fecha_ingreso DESC`,
    [clienteId]
  );
  return rows;
}

export async function listarHorasOcupadasVeterinario(veterinarioId, fecha) {
  const [rows] = await pool.execute(
    `SELECT TIME_FORMAT(c.fecha_hora, '%H:%i') AS hora
     FROM citas c
     INNER JOIN estados_cita e ON e.id_estado = c.id_estado
     WHERE c.id_veterinario = ?
       AND DATE(c.fecha_hora) = ?
       AND e.nombre_estado NOT IN ('Cancelada', 'No asistió')
     ORDER BY c.fecha_hora ASC`,
    [veterinarioId, fecha]
  );
  return rows.map((r) => r.hora);
}
