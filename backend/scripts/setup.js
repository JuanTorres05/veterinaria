/**
 * setup.js — Configura la BD completa desde cero
 * 1. Crea la base de datos si no existe
 * 2. Aplica el schema.sql (tablas + datos iniciales de catálogos)
 * 3. Inserta los usuarios de prueba con contraseña hasheada
 *
 * Uso: node scripts/setup.js
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const HOST     = process.env.DB_HOST     || 'localhost';
const PORT     = Number(process.env.DB_PORT || 3306);
const USER     = process.env.DB_USER     || 'root';
const PASSWORD = process.env.DB_PASSWORD || '';
const DATABASE = process.env.DB_NAME     || 'datavet';

const PASS = 'test1234';

const usuarios = [
  { cedula: '0000000001', nombre: 'Administrador DataVet',  email: 'admin@datavet.com',          rol: 'admin'          },
  { cedula: '0000000002', nombre: 'Carlos Mendoza',         email: 'carlos.mendoza@datavet.com', rol: 'veterinario',   especialidad: 'Medicina Interna y Cirugía', tarjeta_profesional: 'TP-VET-98421', colegiada: 'COL-VET-042' },
  { cedula: '0000000003', nombre: 'Laura Recepción',        email: 'recepcion@datavet.com',      rol: 'recepcionista'  },
];

async function main() {
  // ── 1. Crear la BD si no existe ────────────────────────────────────────────
  console.log(`\n📦 PASO 1 — Creando base de datos "${DATABASE}" si no existe...`);
  const rootConn = await mysql.createConnection({ host: HOST, port: PORT, user: USER, password: PASSWORD });
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.end();
  console.log(`✅ Base de datos lista.\n`);

  // ── 2. Aplicar el schema.sql ───────────────────────────────────────────────
  console.log(`📋 PASO 2 — Aplicando schema.sql...`);
  const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
  const schemaSql  = fs.readFileSync(schemaPath, 'utf8');

  // Necesitamos multipleStatements para ejecutar varios SEQLs juntos
  const schemaConn = await mysql.createConnection({
    host: HOST, port: PORT, user: USER, password: PASSWORD,
    database: DATABASE,
    multipleStatements: true,
  });
  await schemaConn.query(schemaSql);
  await schemaConn.end();
  console.log(`✅ Schema aplicado correctamente.\n`);

  // ── 3. Insertar usuarios de prueba ─────────────────────────────────────────
  console.log(`👥 PASO 3 — Insertando usuarios de prueba...`);
  const conn = await mysql.createConnection({ host: HOST, port: PORT, user: USER, password: PASSWORD, database: DATABASE });

  const hash = await bcrypt.hash(PASS, 12);

  for (const u of usuarios) {
    const [roles] = await conn.execute('SELECT id FROM roles WHERE nombre = ? LIMIT 1', [u.rol]);

    if (!roles.length) {
      console.error(`❌ Rol "${u.rol}" no encontrado.`);
      continue;
    }

    const rolId = roles[0].id;

    await conn.execute(
      `INSERT INTO usuarios (cedula, nombre, email, password_hash, rol_id, especialidad, tarjeta_profesional, colegiada, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre), email = VALUES(email), password_hash = VALUES(password_hash),
         rol_id = VALUES(rol_id), especialidad = VALUES(especialidad),
         tarjeta_profesional = VALUES(tarjeta_profesional), colegiada = VALUES(colegiada)`,
      [u.cedula, u.nombre, u.email ?? null, hash, rolId, u.especialidad ?? null, u.tarjeta_profesional ?? null, u.colegiada ?? null]
    );

    console.log(`  ✔ ${u.rol.padEnd(15)} | ${u.cedula} | ${u.nombre}`);
  }

  await conn.end();

  console.log(`
╔══════════════════════════════════════════════════════╗
║        🎉 SETUP COMPLETADO — DataVet listo           ║
╠══════════════════════════════════════════════════════╣
║  Rol            │ Cédula       │ Contraseña          ║
║─────────────────┼──────────────┼─────────────────────║
║  Admin          │ 0000000001   │ test1234            ║
║  Veterinario    │ 0000000002   │ test1234            ║
║  Recepcionista  │ 0000000003   │ test1234            ║
╚══════════════════════════════════════════════════════╝

  Ahora ejecuta:  npm run dev
  Frontend:       cd ../frontend && npm run dev
  Abre:           http://localhost:5173
`);
}

main().catch((err) => {
  console.error('\n❌ Error en setup:', err.message);
  console.error('   Verifica que MySQL esté corriendo y que las credenciales en .env sean correctas.');
  process.exit(1);
});
