/**
 * seed.js — Inserta/actualiza los usuarios iniciales de DataVet
 * Crea: Admin (666666666 / 123456), Recepcionista (1 / test1234), Veterinarios (2 y 3 / test1234)
 *
 * Uso: node scripts/seed.js
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const usuarios = [
  {
    cedula: 666666666,
    nombre: 'Juan Torres',
    email: 'admin@datavet.com',
    rol: 'Administrador',
    pass: '123456',
  },
  {
    cedula: 1,
    nombre: 'Laura Martinez',
    email: 'recepcion@datavet.com',
    rol: 'Recepcionista',
    pass: 'test1234',
  },
  {
    cedula: 2,
    nombre: 'Carlos Ramirez',
    email: 'carlos@datavet.com',
    rol: 'Veterinario',
    pass: 'test1234',
    especialidad: 'Medicina general',
    tarjeta_profesional: 'TP-VET-001',
    colegiado: 'COL-2024-001',
  },
  {
    cedula: 3,
    nombre: 'Ana Rodriguez',
    email: 'ana@datavet.com',
    rol: 'Veterinario',
    pass: 'test1234',
    especialidad: 'Cirugia veterinaria',
    tarjeta_profesional: 'TP-VET-002',
    colegiado: 'COL-2024-002',
  },
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'datavet',
  });

  console.log('✅ Conectado a MySQL\n');

  for (const u of usuarios) {
    const [roles] = await conn.execute(
      'SELECT id_rol FROM roles WHERE nombre_rol = ? LIMIT 1',
      [u.rol]
    );

    if (!roles.length) {
      console.error(`❌ Rol "${u.rol}" no encontrado. ¿Aplicaste base de datos Datavet.sql?`);
      continue;
    }

    const rolId = roles[0].id_rol;
    const hash = await bcrypt.hash(u.pass, 10);

    await conn.execute(
      `INSERT INTO usuarios (cedula, nombre, email, password_hash, id_rol, activo)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
        nombre = VALUES(nombre),
        password_hash = VALUES(password_hash),
        id_rol = VALUES(id_rol),
        activo = 1`,
      [u.cedula, u.nombre, u.email, hash, rolId]
    );

    console.log(`👤 ${u.rol.padEnd(15)} | Cédula: ${String(u.cedula).padEnd(10)} | Clave: ${u.pass.padEnd(8)} | ${u.nombre}`);
  }

  await conn.end();

  console.log('\n🎉 Seed completado. Credenciales para el login:');
  console.log('─────────────────────────────────────────────');
  console.log('  Rol            │ Cédula       │ Contraseña');
  console.log('─────────────────────────────────────────────');
  console.log('  Admin          │ 666666666    │ 123456');
  console.log('  Recepcionista  │ 1            │ test1234');
  console.log('  Veterinario    │ 2            │ test1234');
  console.log('  Veterinario    │ 3            │ test1234');
  console.log('─────────────────────────────────────────────');
}

main().catch((err) => {
  console.error('❌ Error en seed:', err.message);
  process.exit(1);
});
