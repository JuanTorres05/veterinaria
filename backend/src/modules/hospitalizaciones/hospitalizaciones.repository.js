import pool from '../../db/pool.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../errors/http.errors.js';

const selectHospitalizaciones = `
  SELECT
    h.id_hospitalizacion AS id,
    h.id_mascota AS mascota_id,
    m.nombre AS mascota_nombre,
    m.especie,
    m.raza,
    m.foto_url AS mascota_foto_url,
    TRIM(CONCAT(c.nombre, ' ', IFNULL(c.apellido, ''))) AS cliente_nombre,
    c.telefono AS cliente_telefono,
    h.id_veterinario AS veterinario_id,
    u.nombre AS veterinario_nombre,
    h.id_consulta AS consulta_id,
    h.fecha_ingreso,
    h.fecha_egreso,
    TIMESTAMPDIFF(HOUR, h.fecha_ingreso, COALESCE(h.fecha_egreso, NOW())) AS horas_estancia,
    h.motivo,
    h.tratamientos_realizados,
    h.observaciones,
    h.estado
  FROM hospitalizaciones h
  INNER JOIN mascotas m ON m.id_mascota = h.id_mascota
  INNER JOIN clientes c ON c.id_cliente = m.id_cliente
  INNER JOIN veterinarios v ON v.id_veterinario = h.id_veterinario
  INNER JOIN usuarios u ON u.id_usuario = v.id_usuario
`;

const TIPO_EVOLUCION = 'Evolución Intrahospitalaria';

export async function listar({ estado } = {}) {
  const conditions = [];
  const params = [];
  if (estado) {
    conditions.push('h.estado = ?');
    params.push(estado);
  }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `${selectHospitalizaciones}${where} ORDER BY FIELD(h.estado, 'Activa', 'Finalizada', 'Cancelada'), h.fecha_ingreso DESC`,
    params
  );

  if (rows.length === 0) return [];

  const hospIds = rows.map((r) => r.id);
  const placeholders = hospIds.map(() => '?').join(',');
  const [evoRows] = await pool.execute(
    `SELECT
      p.id_procedimiento AS id,
      p.id_hospitalizacion,
      p.fecha_procedimiento AS fecha,
      p.descripcion AS tratamientos,
      p.observaciones,
      u.nombre AS veterinario_nombre
     FROM procedimientos p
     INNER JOIN veterinarios v ON v.id_veterinario = p.id_veterinario
     INNER JOIN usuarios u ON u.id_usuario = v.id_usuario
     WHERE p.id_hospitalizacion IN (${placeholders})
       AND p.tipo_procedimiento = ?
     ORDER BY p.fecha_procedimiento DESC, p.id_procedimiento DESC`,
    [...hospIds, TIPO_EVOLUCION]
  );

  const evoMap = new Map();
  for (const ev of evoRows) {
    if (!evoMap.has(ev.id_hospitalizacion)) evoMap.set(ev.id_hospitalizacion, []);
    evoMap.get(ev.id_hospitalizacion).push(ev);
  }

  return rows.map((r) => ({
    ...r,
    evoluciones: evoMap.get(r.id) || [],
  }));
}

export async function buscarPorId(id) {
  const [rows] = await pool.execute(`${selectHospitalizaciones} WHERE h.id_hospitalizacion = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function crear({
  mascota_id,
  usuario_id,
  veterinario_id = null,
  consulta_id = null,
  motivo,
  tratamientos_realizados = null,
  observaciones = null,
}) {
  let idVet = veterinario_id;
  if (!idVet) {
    const [[vet]] = await pool.execute(
      'SELECT id_veterinario FROM veterinarios WHERE id_usuario = ? AND activo = 1 LIMIT 1',
      [usuario_id]
    );
    idVet = vet?.id_veterinario || null;
  }
  if (!idVet) {
    throw new BadRequestError('Debe seleccionar o ser un profesional veterinario activo para registrar la hospitalización.');
  }

  const [[activa]] = await pool.execute(
    "SELECT id_hospitalizacion FROM hospitalizaciones WHERE id_mascota = ? AND estado = 'Activa' LIMIT 1",
    [mascota_id]
  );
  if (activa) {
    throw new ConflictError('Esta mascota ya se encuentra hospitalizada actualmente.');
  }

  const [res] = await pool.execute(
    `INSERT INTO hospitalizaciones
      (id_mascota, id_veterinario, id_consulta, fecha_ingreso, motivo, tratamientos_realizados, observaciones, estado)
     VALUES (?, ?, ?, NOW(), ?, ?, ?, 'Activa')`,
    [mascota_id, idVet, consulta_id || null, motivo, tratamientos_realizados || null, observaciones || null]
  );

  return buscarPorId(res.insertId);
}

export async function actualizar(id, { tratamientos_realizados, observaciones, notas_alta, estado, usuario_id }) {
  const actual = await buscarPorId(id);
  if (!actual) {
    throw new NotFoundError('Registro de hospitalización no encontrado.');
  }

  // Resolver id_veterinario de quien registra la evolución o el alta (fallback al veterinario de ingreso)
  let idVetActor = actual.veterinario_id;
  if (usuario_id) {
    const [[vet]] = await pool.execute(
      'SELECT id_veterinario FROM veterinarios WHERE id_usuario = ? AND activo = 1 LIMIT 1',
      [usuario_id]
    );
    if (vet) idVetActor = vet.id_veterinario;
  }

  const nuevoEstado = estado || actual.estado;
  const esAlta = nuevoEstado === 'Finalizada' && actual.estado !== 'Finalizada';
  const cerrando = nuevoEstado === 'Finalizada' || nuevoEstado === 'Cancelada';

  // 1. Si no se está cerrando y se enviaron notas/tratamientos, insertar un NUEVO registro de evolución cronológico
  const hayNuevaEvolucion =
    !cerrando &&
    ((tratamientos_realizados && tratamientos_realizados.trim()) ||
      (observaciones && observaciones.trim()));

  if (hayNuevaEvolucion) {
    await pool.execute(
      `INSERT INTO procedimientos
        (id_hospitalizacion, id_veterinario, fecha_procedimiento, tipo_procedimiento, descripcion, observaciones)
       VALUES (?, ?, NOW(), ?, ?, ?)`,
      [
        id,
        idVetActor,
        TIPO_EVOLUCION,
        tratamientos_realizados?.trim() || null,
        observaciones?.trim() || null,
      ]
    );
  }

  // 2. Actualizar estado / fecha_egreso de la hospitalización (sin borrar tratamientos previos si no se envían)
  await pool.execute(
    `UPDATE hospitalizaciones
     SET estado = ?,
         fecha_egreso = CASE
           WHEN ? = 1 THEN COALESCE(fecha_egreso, NOW())
           WHEN ? = 'Activa' THEN NULL
           ELSE fecha_egreso
         END
     WHERE id_hospitalizacion = ?`,
    [nuevoEstado, cerrando ? 1 : 0, nuevoEstado, id]
  );

  // 3. Al dar de Alta ('Finalizada'), registrar automáticamente el egreso en la Historia Clínica (consultas_medicas)
  if (esAlta) {
    let [[historia]] = await pool.execute(
      'SELECT id_historia FROM historias_clinicas WHERE id_mascota = ? LIMIT 1',
      [actual.mascota_id]
    );
    if (!historia) {
      const [hRes] = await pool.execute(
        `INSERT INTO historias_clinicas (id_mascota, fecha_apertura, estado, observaciones_generales)
         VALUES (?, CURDATE(), 'Activa', 'Historia clínica aperturada en alta hospitalaria')`,
        [actual.mascota_id]
      );
      historia = { id_historia: hRes.insertId };
    }

    const [evoluciones] = await pool.execute(
      `SELECT fecha_procedimiento, descripcion, observaciones
       FROM procedimientos
       WHERE id_hospitalizacion = ? AND tipo_procedimiento = ?
       ORDER BY fecha_procedimiento ASC`,
      [id, TIPO_EVOLUCION]
    );

    const resumenTratamientos = [
      actual.tratamientos_realizados,
      ...evoluciones.map((e) => e.descripcion).filter(Boolean),
    ]
      .filter(Boolean)
      .join(' | ');

    const resumenObservaciones = [
      notas_alta?.trim() ? `Indicaciones de alta: ${notas_alta.trim()}` : null,
      actual.observaciones,
      ...evoluciones.map((e) => e.observaciones).filter(Boolean),
    ]
      .filter(Boolean)
      .join(' | ');

    await pool.execute(
      `INSERT INTO consultas_medicas
        (id_cita, id_historia, id_veterinario, fecha_consulta, sintomas, diagnostico, tratamiento_resumen, observaciones, estado)
       VALUES (NULL, ?, ?, NOW(), ?, ?, ?, ?, 'Finalizada')`,
      [
        historia.id_historia,
        idVetActor,
        `Alta de hospitalización: ${actual.motivo}`,
        `Egreso hospitalario (${actual.horas_estancia ?? 0} h de estancia)`,
        resumenTratamientos || 'Manejo intrahospitalario completado',
        resumenObservaciones || 'Paciente dado de alta en condiciones estables.',
      ]
    );
  }

  const updated = await buscarPorId(id);
  const [evoUpdated] = await pool.execute(
    `SELECT
      p.id_procedimiento AS id,
      p.id_hospitalizacion,
      p.fecha_procedimiento AS fecha,
      p.descripcion AS tratamientos,
      p.observaciones,
      u.nombre AS veterinario_nombre
     FROM procedimientos p
     INNER JOIN veterinarios v ON v.id_veterinario = p.id_veterinario
     INNER JOIN usuarios u ON u.id_usuario = v.id_usuario
     WHERE p.id_hospitalizacion = ?
       AND p.tipo_procedimiento = ?
     ORDER BY p.fecha_procedimiento DESC, p.id_procedimiento DESC`,
    [id, TIPO_EVOLUCION]
  );

  return { ...updated, evoluciones: evoUpdated };
}
