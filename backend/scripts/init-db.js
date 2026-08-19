import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function run() {
  console.log('🚀 Inicializando la base de datos "datavet_db" en XAMPP...');

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
  });

  await conn.query('DROP DATABASE IF EXISTS `datavet_db`;');
  await conn.query('CREATE DATABASE `datavet_db`;');
  await conn.query('USE `datavet_db`;');

  console.log('📋 Creando Tablas limpias...');

  await conn.query(`
    CREATE TABLE roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(30) NOT NULL UNIQUE
    ) ENGINE=InnoDB;
  `);

  await conn.query(`
    CREATE TABLE usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cedula VARCHAR(20) NOT NULL UNIQUE,
      nombre VARCHAR(120) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      rol_id INT NOT NULL,
      activo TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rol_id) REFERENCES roles(id)
    ) ENGINE=InnoDB;
  `);

  await conn.query(`
    CREATE TABLE clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      telefono VARCHAR(20) NOT NULL,
      correo VARCHAR(120) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await conn.query(`
    CREATE TABLE mascotas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cliente_id INT NOT NULL,
      nombre VARCHAR(120) NOT NULL,
      especie VARCHAR(80) NOT NULL,
      raza VARCHAR(80) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ) ENGINE=InnoDB;
  `);

  await conn.query(`
    INSERT INTO roles (nombre)
    VALUES ('admin'), ('veterinario'), ('recepcionista');
  `);

  console.log('🔑 Creando usuarios de prueba (clave: test1234)...');
  const passHash = await bcrypt.hash('test1234', 10);

  const seedUsers = [
    { cedula: '0000000001', nombre: 'Admin DATAVET', rol: 'admin' },
    { cedula: '0000000002', nombre: 'Dr. Carlos Mendoza', rol: 'veterinario' },
    { cedula: '0000000003', nombre: 'Laura Recepción', rol: 'recepcionista' },
  ];

  for (const u of seedUsers) {
    const [[rolRow]] = await conn.execute('SELECT id FROM roles WHERE nombre = ?', [u.rol]);
    if (rolRow) {
      await conn.execute(
        `INSERT INTO usuarios (cedula, nombre, password_hash, rol_id, activo)
         VALUES (?, ?, ?, ?, 1)`,
        [u.cedula, u.nombre, passHash, rolRow.id]
      );
      console.log(`   ✔ Usuario: ${u.nombre} [Cédula: ${u.cedula}] registrado.`);
    }
  }

  const [usersInDb] = await conn.execute('SELECT id, cedula, nombre, activo FROM usuarios');
  console.log('\n🎉 ¡BASE DE DATOS DATAVET_DB CREADA E INICIALIZADA AL 100%!');
  console.table(usersInDb);

  await conn.end();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
