/**
 * seed.js — Inserta los usuarios iniciales de DataVet
 * Crea: admin (0000000001), veterinario (0000000002), recepcionista (0000000003)
 * Contraseña de todos: test1234
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

const PASS = 'test1234';

const usuarios = [
  {
    cedula: '0000000001',
    nombre: 'Administrador DataVet',
    email: 'admin@datavet.com',
    rol: 'admin',
  },
  {
    cedula: '0000000002',
    nombre: 'Carlos Mendoza',
    email: 'carlos.mendoza@datavet.com',
    rol: 'veterinario',
    especialidad: 'Medicina Interna y Cirugía',
    tarjeta_profesional: 'TP-VET-98421',
    colegiada: 'COL-VET-042',
  },
  {
    cedula: '0000000003',
    nombre: 'Laura Recepción',
    email: 'recepcion@datavet.com',
    rol: 'recepcionista',
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

  const hash = await bcrypt.hash(PASS, 12);
  console.log(`🔐 Hash generado para contraseña "${PASS}"\n`);

  for (const u of usuarios) {
    // Obtener id del rol
    const [roles] = await conn.execute(
      'SELECT id FROM roles WHERE nombre = ? LIMIT 1',
      [u.rol]
    );

    if (!roles.length) {
      console.error(`❌ Rol "${u.rol}" no encontrado. ¿Aplicaste el schema.sql?`);
      continue;
    }

    const rolId = roles[0].id;

    await conn.execute(
      `INSERT INTO usuarios
        (cedula, nombre, email, password_hash, rol_id, especialidad, tarjeta_profesional, colegiada, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
        nombre = VALUES(nombre),
        email = VALUES(email),
        password_hash = VALUES(password_hash),
        rol_id = VALUES(rol_id),
        especialidad = VALUES(especialidad),
        tarjeta_profesional = VALUES(tarjeta_profesional),
        colegiada = VALUES(colegiada)`,
      [
        u.cedula,
        u.nombre,
        u.email ?? null,
        hash,
        rolId,
        u.especialidad ?? null,
        u.tarjeta_profesional ?? null,
        u.colegiada ?? null,
      ]
    );

    console.log(`👤 ${u.rol.padEnd(15)} | Cédula: ${u.cedula} | ${u.nombre}`);
  }

  await conn.end();

  console.log('\n🎉 Seed completado. Credenciales para el login:');
  console.log('─────────────────────────────────────────────');
  console.log('  Rol            │ Cédula       │ Contraseña');
  console.log('─────────────────────────────────────────────');
  console.log('  Admin          │ 0000000001   │ test1234');
  console.log('  Veterinario    │ 0000000002   │ test1234');
  console.log('  Recepcionista  │ 0000000003   │ test1234');
  console.log('─────────────────────────────────────────────');
}

main().catch((err) => {
  console.error('❌ Error en seed:', err.message);
  process.exit(1);
});
