import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS total FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].total > 0;
}

async function addColumnIfMissing(conn, table, column, definition) {
  const exists = await columnExists(conn, table, column);
  if (!exists) {
    console.log(`➕ Agregando columna '${column}' a tabla '${table}'...`);
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } else {
    console.log(`✔️ Columna '${column}' ya existe en '${table}'.`);
  }
}

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '1234';
  const database = process.env.DB_NAME || 'datavet';

  console.log(`🔌 Conectando a MySQL en ${host}:${port}/${database}...`);
  const conn = await mysql.createConnection({ host, port, user, password, database });

  console.log('\n📦 --- 1. ENRIQUECIENDO TABLAS EXISTENTES ---');

  // 1. Clientes
  await addColumnIfMissing(conn, 'clientes', 'apellido', 'VARCHAR(120) NULL AFTER `nombre`');
  await addColumnIfMissing(conn, 'clientes', 'cedula', 'VARCHAR(20) NULL AFTER `id`');
  await addColumnIfMissing(conn, 'clientes', 'direccion', 'VARCHAR(255) NULL AFTER `correo`');
  await addColumnIfMissing(conn, 'clientes', 'activo', 'TINYINT(1) NOT NULL DEFAULT 1');

  // 2. Mascotas
  await addColumnIfMissing(conn, 'mascotas', 'sexo', "VARCHAR(20) DEFAULT 'Macho' AFTER `raza`");
  await addColumnIfMissing(conn, 'mascotas', 'fecha_nacimiento', 'DATE NULL AFTER `sexo`');
  await addColumnIfMissing(conn, 'mascotas', 'peso_kg', 'DECIMAL(5,2) NULL AFTER `fecha_nacimiento`');
  await addColumnIfMissing(conn, 'mascotas', 'color', 'VARCHAR(80) NULL AFTER `peso_kg`');
  await addColumnIfMissing(conn, 'mascotas', 'microchip', 'VARCHAR(50) NULL AFTER `color`');
  await addColumnIfMissing(conn, 'mascotas', 'foto_url', 'VARCHAR(255) NULL AFTER `microchip`');
  await addColumnIfMissing(conn, 'mascotas', 'observaciones', 'TEXT NULL AFTER `foto_url`');
  await addColumnIfMissing(conn, 'mascotas', 'activo', 'TINYINT(1) NOT NULL DEFAULT 1');

  // 3. Usuarios (Atributos de Veterinario/Usuario)
  await addColumnIfMissing(conn, 'usuarios', 'email', 'VARCHAR(120) NULL AFTER `nombre`');
  await addColumnIfMissing(conn, 'usuarios', 'especialidad', 'VARCHAR(100) NULL AFTER `rol_id`');
  await addColumnIfMissing(conn, 'usuarios', 'tarjeta_profesional', 'VARCHAR(50) NULL AFTER `especialidad`');
  await addColumnIfMissing(conn, 'usuarios', 'colegiada', 'VARCHAR(50) NULL AFTER `tarjeta_profesional`');

  // 4. Citas
  await addColumnIfMissing(conn, 'citas', 'duracion_min', 'INT NOT NULL DEFAULT 30 AFTER `motivo`');
  await addColumnIfMissing(conn, 'citas', 'notas_cancelacion', 'TEXT NULL AFTER `duracion_min`');
  await addColumnIfMissing(conn, 'citas', 'observaciones', 'TEXT NULL AFTER `notas_cancelacion`');

  // 5. Historial Clínico
  await addColumnIfMissing(conn, 'historial_clinico', 'sintomas', 'TEXT NULL AFTER `motivo`');
  await addColumnIfMissing(conn, 'historial_clinico', 'observaciones', 'TEXT NULL AFTER `notas`');

  console.log('\n🏗️ --- 2. CREANDO TABLAS ADICIONALES DEL DIAGRAMA ---');

  // Tabla ESTADOS_CITA
  await conn.query(`
    CREATE TABLE IF NOT EXISTS estados_cita (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre_estado VARCHAR(30) NOT NULL UNIQUE,
      descripcion VARCHAR(255) NULL
    ) ENGINE=InnoDB;
  `);
  console.log('✅ Tabla estados_cita asegurada.');

  // Semilla de estados_cita
  await conn.query(`
    INSERT INTO estados_cita (nombre_estado, descripcion)
    VALUES 
      ('pendiente', 'Cita agendada a la espera de atención médica'),
      ('atendida', 'Cita completada por el profesional veterinario'),
      ('cancelada', 'Cita suspendida por el cliente o la clínica')
    ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);
  `);

  // Tabla SERVICIOS
  await conn.query(`
    CREATE TABLE IF NOT EXISTS servicios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre_servicio VARCHAR(120) NOT NULL UNIQUE,
      descripcion TEXT NULL,
      precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      activo TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
  console.log('✅ Tabla servicios asegurada.');

  // Semilla de servicios
  await conn.query(`
    INSERT INTO servicios (nombre_servicio, descripcion, precio)
    VALUES 
      ('Consulta General', 'Evaluación médica preventiva y diagnóstico general', 45000.00),
      ('Vacunación Canina / Felina', 'Aplicación de biológicos y esquema de inmunización', 35000.00),
      ('Desparasitación Interna', 'Tratamiento oral antiparasitario según peso', 20000.00),
      ('Profilaxis Dental', 'Limpieza y remoción de sarro por ultrasonido', 120000.00),
      ('Cirugía Menor / Esterilización', 'Procedimiento quirúrgico ambulatorio con anestesia', 250000.00)
    ON DUPLICATE KEY UPDATE precio = VALUES(precio);
  `);

  // Tabla CITA_SERVICIO
  await conn.query(`
    CREATE TABLE IF NOT EXISTS cita_servicio (
      id_cita INT NOT NULL,
      id_servicio INT NOT NULL,
      precio_aplicado DECIMAL(10,2) NOT NULL,
      observaciones VARCHAR(255) NULL,
      PRIMARY KEY (id_cita, id_servicio),
      FOREIGN KEY (id_cita) REFERENCES citas(id) ON DELETE CASCADE,
      FOREIGN KEY (id_servicio) REFERENCES servicios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);
  console.log('✅ Tabla cita_servicio asegurada.');

  // Tabla HOSPITALIZACIONES
  await conn.query(`
    CREATE TABLE IF NOT EXISTS hospitalizaciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mascota_id INT NOT NULL,
      usuario_id INT NOT NULL,
      fecha_ingreso DATETIME NOT NULL,
      fecha_egreso DATETIME NULL,
      motivo VARCHAR(255) NOT NULL,
      tratamiento TEXT NULL,
      observaciones TEXT NULL,
      estado ENUM('en_curso', 'alta', 'traslado', 'fallecido') NOT NULL DEFAULT 'en_curso',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);
  console.log('✅ Tabla hospitalizaciones asegurada.');

  // Actualizar datos de prueba en usuarios veterinarios con sus tarjetas profesionales y especialidades
  await conn.query(`
    UPDATE usuarios 
    SET especialidad = 'Medicina Interna y Cirugía',
        tarjeta_profesional = 'TP-VET-98421',
        colegiada = 'COL-VET-042',
        email = 'carlos.mendoza@datavet.com'
    WHERE nombre LIKE '%Carlos Mendoza%'
  `);

  await conn.end();
  console.log('\n🎉 ¡MIGRACIÓN EXITOSA! Tu base de datos ahora está 100% alineada con el MER de la imagen.');
}

main().catch(err => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});
