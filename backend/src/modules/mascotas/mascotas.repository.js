import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import pool from '../../db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads/procedimientos');

const TIPO_SOPORTE_CONSULTA = 'Soporte Multimedia de Consulta';

// Asegurar carpeta uploads/procedimientos y archivo demo inicial
(function initUploadsDir() {
  try {
    fsSync.mkdirSync(UPLOADS_DIR, { recursive: true });
    const demoPdfPath = path.join(UPLOADS_DIR, 'radiografia_control_max.pdf');
    if (!fsSync.existsSync(demoPdfPath)) {
      const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 168 >> stream
BT
/F1 18 Tf
50 720 Td
(DATAVET - Radiografia y Control Clinico: Paciente Max) Tj
/F1 12 Tf
0 -30 Td
(Documento PDF de soporte diagnostico adjunto al procedimiento clinico.) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000460 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
528
%%EOF`;
      fsSync.writeFileSync(demoPdfPath, minimalPdf, 'utf8');
    }
  } catch (err) {
    console.error('No se pudo inicializar directorio de uploads:', err.message);
  }
})();

async function guardarArchivoFisico(archivo) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const rawBase64 = archivo.base64_data.includes(',')
    ? archivo.base64_data.split(',')[1]
    : archivo.base64_data;
  const buffer = Buffer.from(rawBase64, 'base64');

  const safeOriginal = (archivo.nombre_archivo || 'archivo')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-100);
  const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeOriginal}`;
  const fullPath = path.join(UPLOADS_DIR, uniqueName);
  await fs.writeFile(fullPath, buffer);

  const mime = (archivo.mime_type || 'application/octet-stream').toLowerCase();
  const tipoArchivo = mime === 'application/pdf' ? 'pdf' : 'imagen';

  return {
    nombre_archivo: archivo.nombre_archivo,
    tipo_archivo: tipoArchivo,
    mime_type: mime,
    ruta_archivo: `/uploads/procedimientos/${uniqueName}`,
    tamano_bytes: buffer.length,
  };
}

async function insertarArchivosEnProcedimiento(procedimientoId, usuarioId, archivos = []) {
  const insertados = [];
  for (const arch of archivos) {
    const meta = await guardarArchivoFisico(arch);
    const [res] = await pool.execute(
      `INSERT INTO archivos_procedimiento 
        (id_procedimiento, id_usuario_subio, nombre_archivo, tipo_archivo, mime_type, ruta_archivo, tamano_bytes, fecha_subida)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        procedimientoId,
        usuarioId,
        meta.nombre_archivo,
        meta.tipo_archivo,
        meta.mime_type,
        meta.ruta_archivo,
        meta.tamano_bytes,
      ]
    );
    insertados.push({
      id: res.insertId,
      id_procedimiento: procedimientoId,
      nombre_archivo: meta.nombre_archivo,
      tipo_archivo: meta.tipo_archivo,
      mime_type: meta.mime_type,
      ruta_archivo: meta.ruta_archivo,
      tamano_bytes: meta.tamano_bytes,
      fecha_subida: new Date().toISOString(),
    });
  }
  return insertados;
}

async function resolverIdVeterinario(usuarioId, citaId = null) {
  let [[vet]] = await pool.execute(
    'SELECT id_veterinario FROM veterinarios WHERE id_usuario = ? LIMIT 1',
    [usuarioId]
  );
  if (!vet && citaId) {
    [[vet]] = await pool.execute(
      'SELECT id_veterinario FROM citas WHERE id_cita = ? LIMIT 1',
      [citaId]
    );
  }
  if (!vet) {
    [[vet]] = await pool.execute('SELECT id_veterinario FROM veterinarios WHERE activo = 1 LIMIT 1');
  }
  return vet ? vet.id_veterinario : 1;
}

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
      cm.id_cita AS cita_id,
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

  if (rows.length === 0) return [];

  // Obtener archivos adjuntos a estas consultas (vía hospitalizaciones -> procedimientos -> archivos_procedimiento)
  const consultaIds = rows.map((r) => r.id);
  const placeholders = consultaIds.map(() => '?').join(',');
  const [archivosRows] = await pool.execute(
    `SELECT 
      ap.id_archivo AS id,
      h.id_consulta AS consulta_id,
      ap.id_procedimiento,
      ap.nombre_archivo,
      ap.tipo_archivo,
      ap.mime_type,
      ap.ruta_archivo,
      ap.tamano_bytes,
      ap.fecha_subida,
      u.nombre AS subido_por
    FROM archivos_procedimiento ap
    INNER JOIN procedimientos p ON p.id_procedimiento = ap.id_procedimiento
    INNER JOIN hospitalizaciones h ON h.id_hospitalizacion = p.id_hospitalizacion
    LEFT JOIN usuarios u ON u.id_usuario = ap.id_usuario_subio
    WHERE h.id_consulta IN (${placeholders})
      AND p.tipo_procedimiento = ?
    ORDER BY ap.fecha_subida DESC`,
    [...consultaIds, TIPO_SOPORTE_CONSULTA]
  );

  const archivosPorConsulta = new Map();
  for (const arch of archivosRows) {
    if (!archivosPorConsulta.has(arch.consulta_id)) {
      archivosPorConsulta.set(arch.consulta_id, []);
    }
    archivosPorConsulta.get(arch.consulta_id).push(arch);
  }

  return rows.map((r) => ({
    ...r,
    archivos: archivosPorConsulta.get(r.id) || [],
  }));
}

export async function listarProcedimientos(mascotaId) {
  const [rows] = await pool.execute(`
    SELECT 
      p.id_procedimiento AS id,
      p.id_hospitalizacion,
      h.id_consulta AS consulta_id,
      p.fecha_procedimiento AS fecha,
      p.tipo_procedimiento,
      p.descripcion,
      p.observaciones,
      u.nombre AS veterinario_nombre
    FROM procedimientos p
    INNER JOIN hospitalizaciones h ON h.id_hospitalizacion = p.id_hospitalizacion
    INNER JOIN veterinarios v ON v.id_veterinario = p.id_veterinario
    INNER JOIN usuarios u ON u.id_usuario = v.id_usuario
    WHERE h.id_mascota = ?
      AND p.tipo_procedimiento <> ?
    ORDER BY p.fecha_procedimiento DESC
  `, [mascotaId, TIPO_SOPORTE_CONSULTA]);

  if (rows.length === 0) return [];

  const procIds = rows.map((r) => r.id);
  const placeholders = procIds.map(() => '?').join(',');
  const [archivosRows] = await pool.execute(
    `SELECT 
      ap.id_archivo AS id,
      ap.id_procedimiento,
      ap.nombre_archivo,
      ap.tipo_archivo,
      ap.mime_type,
      ap.ruta_archivo,
      ap.tamano_bytes,
      ap.fecha_subida,
      u.nombre AS subido_por
    FROM archivos_procedimiento ap
    LEFT JOIN usuarios u ON u.id_usuario = ap.id_usuario_subio
    WHERE ap.id_procedimiento IN (${placeholders})
    ORDER BY ap.fecha_subida DESC`,
    procIds
  );

  const archivosPorProc = new Map();
  for (const arch of archivosRows) {
    if (!archivosPorProc.has(arch.id_procedimiento)) {
      archivosPorProc.set(arch.id_procedimiento, []);
    }
    archivosPorProc.get(arch.id_procedimiento).push(arch);
  }

  return rows.map((r) => ({
    ...r,
    archivos: archivosPorProc.get(r.id) || [],
  }));
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

export async function subirArchivosConsulta({ mascota_id, consulta_id, usuario_id, archivos = [] }) {
  if (!archivos || archivos.length === 0) return [];

  const idVeterinario = await resolverIdVeterinario(usuario_id);

  // 1. Buscar o crear registro en hospitalizaciones asociado a esta consulta
  let [[hosp]] = await pool.execute(
    'SELECT id_hospitalizacion FROM hospitalizaciones WHERE id_consulta = ? LIMIT 1',
    [consulta_id]
  );
  if (!hosp) {
    const [hRes] = await pool.execute(
      `INSERT INTO hospitalizaciones 
        (id_mascota, id_veterinario, id_consulta, fecha_ingreso, fecha_egreso, motivo, tratamientos_realizados, observaciones, estado)
       VALUES (?, ?, ?, NOW(), NOW(), 'Atención y soporte diagnóstico de consulta', 'Registro de soportes clínicos', NULL, 'Finalizada')`,
      [mascota_id, idVeterinario, consulta_id]
    );
    hosp = { id_hospitalizacion: hRes.insertId };
  }

  // 2. Buscar o crear procedimiento contenedor para soportes multimedia de la consulta
  let [[proc]] = await pool.execute(
    'SELECT id_procedimiento FROM procedimientos WHERE id_hospitalizacion = ? AND tipo_procedimiento = ? LIMIT 1',
    [hosp.id_hospitalizacion, TIPO_SOPORTE_CONSULTA]
  );
  if (!proc) {
    const [pRes] = await pool.execute(
      `INSERT INTO procedimientos 
        (id_hospitalizacion, id_veterinario, fecha_procedimiento, tipo_procedimiento, descripcion, observaciones)
       VALUES (?, ?, NOW(), ?, 'Archivos e imágenes adjuntas a la consulta médica', NULL)`,
      [hosp.id_hospitalizacion, idVeterinario, TIPO_SOPORTE_CONSULTA]
    );
    proc = { id_procedimiento: pRes.insertId };
  }

  // 3. Guardar archivos en disco e insertar en archivos_procedimiento
  return insertarArchivosEnProcedimiento(proc.id_procedimiento, usuario_id, archivos);
}

export async function crearProcedimiento({
  mascota_id,
  usuario_id,
  consulta_id,
  tipo_procedimiento,
  descripcion,
  observaciones,
  fecha_procedimiento,
  archivos = [],
}) {
  const idVeterinario = await resolverIdVeterinario(usuario_id);

  // 1. Resolver o crear hospitalización para asociar el procedimiento (cumpliendo FK id_hospitalizacion del MER)
  let idHospitalizacion = null;
  if (consulta_id) {
    const [[hospConsulta]] = await pool.execute(
      'SELECT id_hospitalizacion FROM hospitalizaciones WHERE id_consulta = ? LIMIT 1',
      [consulta_id]
    );
    if (hospConsulta) {
      idHospitalizacion = hospConsulta.id_hospitalizacion;
    } else {
      const [hRes] = await pool.execute(
        `INSERT INTO hospitalizaciones 
          (id_mascota, id_veterinario, id_consulta, fecha_ingreso, motivo, tratamientos_realizados, observaciones, estado)
         VALUES (?, ?, ?, NOW(), ?, ?, ?, 'Activa')`,
        [mascota_id, idVeterinario, consulta_id, tipo_procedimiento, descripcion, observaciones || null]
      );
      idHospitalizacion = hRes.insertId;
    }
  } else {
    // Crear registro de ingreso/orden de procedimiento con id_consulta = NULL
    const [hRes] = await pool.execute(
      `INSERT INTO hospitalizaciones 
        (id_mascota, id_veterinario, id_consulta, fecha_ingreso, fecha_egreso, motivo, tratamientos_realizados, observaciones, estado)
       VALUES (?, ?, NULL, NOW(), NOW(), ?, ?, ?, 'Finalizada')`,
      [mascota_id, idVeterinario, tipo_procedimiento, descripcion, observaciones || null]
    );
    idHospitalizacion = hRes.insertId;
  }

  const fechaProc = fecha_procedimiento
    ? new Date(fecha_procedimiento).toISOString().slice(0, 19).replace('T', ' ')
    : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ');

  const [pRes] = await pool.execute(
    `INSERT INTO procedimientos 
      (id_hospitalizacion, id_veterinario, fecha_procedimiento, tipo_procedimiento, descripcion, observaciones)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idHospitalizacion, idVeterinario, fechaProc, tipo_procedimiento, descripcion, observaciones || null]
  );

  const procedimientoId = pRes.insertId;
  const archivosInsertados = await insertarArchivosEnProcedimiento(procedimientoId, usuario_id, archivos);

  const [[row]] = await pool.execute(
    `SELECT 
      p.id_procedimiento AS id,
      p.id_hospitalizacion,
      h.id_consulta AS consulta_id,
      p.fecha_procedimiento AS fecha,
      p.tipo_procedimiento,
      p.descripcion,
      p.observaciones,
      u.nombre AS veterinario_nombre
    FROM procedimientos p
    INNER JOIN hospitalizaciones h ON h.id_hospitalizacion = p.id_hospitalizacion
    INNER JOIN veterinarios v ON v.id_veterinario = p.id_veterinario
    INNER JOIN usuarios u ON u.id_usuario = v.id_usuario
    WHERE p.id_procedimiento = ?
    LIMIT 1`,
    [procedimientoId]
  );

  return {
    ...row,
    archivos: archivosInsertados,
  };
}

export async function subirArchivosProcedimiento({ procedimiento_id, usuario_id, archivos = [] }) {
  return insertarArchivosEnProcedimiento(procedimiento_id, usuario_id, archivos);
}

export async function eliminarArchivo({ archivo_id }) {
  const [[arch]] = await pool.execute(
    'SELECT id_archivo, ruta_archivo FROM archivos_procedimiento WHERE id_archivo = ? LIMIT 1',
    [archivo_id]
  );
  if (!arch) return false;

  await pool.execute('DELETE FROM archivos_procedimiento WHERE id_archivo = ?', [archivo_id]);

  // Eliminar archivo físico salvo que sea el archivo demo inicial
  if (arch.ruta_archivo && !arch.ruta_archivo.endsWith('radiografia_control_max.pdf')) {
    const fileName = path.basename(arch.ruta_archivo);
    const fullPath = path.join(UPLOADS_DIR, fileName);
    await fs.unlink(fullPath).catch(() => {});
  }
  return true;
}

export async function crearHistorial({
  mascota_id,
  usuario_id,
  cita_id,
  peso_kg,
  fecha,
  motivo,
  diagnostico,
  tratamiento,
  notas,
  archivos = [],
}) {
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
  const idVeterinario = await resolverIdVeterinario(usuario_id, cita_id);

  // 3. Si se suministró peso_kg en la consulta, actualizar el peso de la mascota
  if (peso_kg && Number(peso_kg) > 0) {
    await pool.execute(
      'UPDATE mascotas SET peso = ? WHERE id_mascota = ?',
      [Number(peso_kg), mascota_id]
    );
  }

  // 4. Verificar si cita_id ya está vinculada en consultas_medicas (por restricción UNIQUE id_cita)
  let idCitaVincular = cita_id || null;
  if (idCitaVincular) {
    const [[existeCita]] = await pool.execute(
      'SELECT id_consulta FROM consultas_medicas WHERE id_cita = ? LIMIT 1',
      [idCitaVincular]
    );
    if (existeCita) {
      idCitaVincular = null;
    }
  }

  // 5. Insertar en consultas_medicas
  let result;
  try {
    [result] = await pool.execute(`
      INSERT INTO consultas_medicas (id_cita, id_historia, id_veterinario, fecha_consulta, sintomas, diagnostico, tratamiento_resumen, observaciones, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Finalizada')
    `, [
      idCitaVincular,
      historia.id_historia,
      idVeterinario,
      fecha,
      motivo,
      diagnostico,
      tratamiento,
      notas || null
    ]);
  } catch {
    [result] = await pool.execute(`
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
  }

  const consultaId = result.insertId;

  // 6. Si viene cita_id, marcar automáticamente la cita como 'Atendida'
  if (cita_id) {
    const [[estadoAtendida]] = await pool.execute(
      "SELECT id_estado FROM estados_cita WHERE nombre_estado = 'Atendida' LIMIT 1"
    );
    if (estadoAtendida) {
      await pool.execute(
        'UPDATE citas SET id_estado = ? WHERE id_cita = ?',
        [estadoAtendida.id_estado, cita_id]
      );
    }
  }

  // 7. Si se adjuntaron fotos o PDFs en la atención de la cita, guardarlos en archivos_procedimiento
  let archivosGuardados = [];
  if (archivos && archivos.length > 0) {
    archivosGuardados = await subirArchivosConsulta({
      mascota_id,
      consulta_id: consultaId,
      usuario_id,
      archivos,
    });
  }

  // 8. Retornar registro formateado
  const [rows] = await pool.execute(`
    SELECT 
      cm.id_consulta AS id, 
      cm.id_cita AS cita_id,
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
  `, [consultaId]);

  return {
    ...rows[0],
    archivos: archivosGuardados,
  };
}
