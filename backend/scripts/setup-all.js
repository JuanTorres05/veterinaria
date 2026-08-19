import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mascotas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  especie VARCHAR(80) NOT NULL,
  raza VARCHAR(80) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS citas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id  INT NOT NULL,
  usuario_id  INT NOT NULL,
  fecha_hora  DATETIME NOT NULL,
  motivo      VARCHAR(255) NOT NULL,
  estado      ENUM('pendiente','atendida','cancelada') NOT NULL DEFAULT 'pendiente',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historial_clinico (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id   INT NOT NULL,
  usuario_id   INT NOT NULL,
  fecha        DATETIME NOT NULL,
  motivo       VARCHAR(255) NOT NULL,
  diagnostico  TEXT NOT NULL,
  tratamiento  TEXT NOT NULL,
  notas        TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

INSERT INTO roles (nombre)
VALUES ('admin'), ('veterinario'), ('recepcionista')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
`;

async function main() {
  const host = '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'datavet';

  console.log(`🔌 Conectando a MySQL XAMPP en ${host}:${port}...`);
  const rootConn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    connectTimeout: 5000,
  });

  console.log(`📦 Creando base de datos "${database}" si no existe...`);
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await rootConn.end();

  console.log(`📋 Conectando a la base de datos "${database}"...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    connectTimeout: 5000,
  });

  console.log('⚡ Creando tablas y roles en MySQL...');
  const statements = SQL_SCHEMA.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await conn.query(stmt);
  }
  console.log('✅ Tablas creadas exitosamente.');

  console.log('🔑 Creando/Actualizando usuarios de prueba con contraseña "test1234"...');
  const passHash = await bcrypt.hash('test1234', 12);

  const usuariosSemilla = [
    { cedula: '0000000001', nombre: 'Admin DATAVET', rol: 'admin' },
    { cedula: '0000000002', nombre: 'Dr. Carlos Mendoza', rol: 'veterinario' },
    { cedula: '0000000003', nombre: 'Laura Recepción', rol: 'recepcionista' },
  ];

  for (const u of usuariosSemilla) {
    const [[rolRow]] = await conn.execute('SELECT id FROM roles WHERE nombre = ?', [u.rol]);
    if (rolRow) {
      await conn.execute(
        `INSERT INTO usuarios (cedula, nombre, password_hash, rol_id, activo)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           nombre = VALUES(nombre),
           password_hash = VALUES(password_hash),
           rol_id = VALUES(rol_id),
           activo = 1`,
        [u.cedula, u.nombre, passHash, rolRow.id]
      );
      console.log(`   👤 Usuario: ${u.nombre} | Cédula: ${u.cedula} | Rol: ${u.rol}`);
    }
  }

  await conn.end();
  console.log('\n🎉 ¡Base de datos "datavet" configurada e inicializada al 100%!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error configurando la base de datos:', err);
  process.exit(1);
});
