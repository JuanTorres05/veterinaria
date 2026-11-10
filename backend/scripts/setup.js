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

const usuarios = [
  { cedula: 666666666, nombre: 'Juan Torres',     email: 'admin@datavet.com',     rol: 'Administrador', pass: '123456' },
  { cedula: 1,         nombre: 'Laura Martinez',  email: 'recepcion@datavet.com', rol: 'Recepcionista', pass: 'test1234' },
  { cedula: 2,         nombre: 'Carlos Ramirez',  email: 'carlos@datavet.com',    rol: 'Veterinario',   pass: 'test1234', especialidad: 'Medicina general',    tarjeta_profesional: 'TP-VET-001', colegiado: 'COL-2024-001' },
  { cedula: 3,         nombre: 'Ana Rodriguez',   email: 'ana@datavet.com',       rol: 'Veterinario',   pass: 'test1234', especialidad: 'Cirugia veterinaria', tarjeta_profesional: 'TP-VET-002', colegiado: 'COL-2024-002' },
];

async function main() {
  // ── 1. Crear la BD si no existe ────────────────────────────────────────────
  console.log(`\n📦 PASO 1 — Creando base de datos "${DATABASE}" si no existe...`);
  const rootConn = await mysql.createConnection({ host: HOST, port: PORT, user: USER, password: PASSWORD });
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.end();
  console.log(`✅ Base de datos lista.\n`);

  // ── 2. Aplicar el script SQL principal ─────────────────────────────────────
  console.log(`📋 PASO 2 — Aplicando base de datos Datavet.sql...`);
  const schemaPath = path.resolve(__dirname, '../../database/base de datos Datavet.sql');
  const schemaSql  = fs.readFileSync(schemaPath, 'utf8');

  const schemaConn = await mysql.createConnection({
    host: HOST, port: PORT, user: USER, password: PASSWORD,
    database: DATABASE,
    multipleStatements: true,
  });
  await schemaConn.query(schemaSql);
  await schemaConn.end();
  console.log(`✅ Esquema y datos base aplicados correctamente.\n`);

  // ── 3. Verificar / sincronizar usuarios de prueba ──────────────────────────
  console.log(`👥 PASO 3 — Sincronizando cuentas de prueba...`);
  const conn = await mysql.createConnection({ host: HOST, port: PORT, user: USER, password: PASSWORD, database: DATABASE });

  for (const u of usuarios) {
    const [roles] = await conn.execute('SELECT id_rol FROM roles WHERE nombre_rol = ? LIMIT 1', [u.rol]);

    if (!roles.length) {
      console.error(`❌ Rol "${u.rol}" no encontrado.`);
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

    console.log(`  ✔ ${u.rol.padEnd(15)} | C.C. ${String(u.cedula).padEnd(10)} | Clave: ${u.pass.padEnd(8)} | ${u.nombre}`);
  }

  await conn.end();

  console.log(`
╔══════════════════════════════════════════════════════╗
║        🎉 SETUP COMPLETADO — DataVet listo           ║
╠══════════════════════════════════════════════════════╣
║  Rol            │ Cédula       │ Contraseña          ║
║─────────────────┼──────────────┼─────────────────────║
║  Admin          │ 666666666    │ 123456              ║
║  Recepcionista  │ 1            │ test1234            ║
║  Veterinario    │ 2            │ test1234            ║
║  Veterinario    │ 3            │ test1234            ║
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
