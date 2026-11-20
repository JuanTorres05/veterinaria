/**
 * init-cloud-db.js — Inicializa de forma segura una BD MySQL en la nube (Railway / Aiven / etc.)
 * - No borra tablas si la base de datos ya está inicializada (idempotente).
 * - Soporta tanto variables DB_* como MYSQL* (Railway) o MYSQL_PUBLIC_URL.
 * - Adapta `CREATE DATABASE` / `USE datavet` al nombre de BD configurado.
 *
 * Uso:
 *   npm run db:init
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const connectionUrl = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL || process.env.DATABASE_URL;

function getDbConfig() {
  if (connectionUrl) {
    const parsed = new URL(connectionUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, '') || 'railway',
    };
  }
  return {
    host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'datavet',
  };
}

const ssl = process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
  : undefined;

const demoUsuarios = [
  { cedula: 666666666, nombre: 'Juan Torres', email: 'admin@datavet.com', rol: 'Administrador', pass: '123456' },
  { cedula: 1, nombre: 'Laura Martinez', email: 'recepcion@datavet.com', rol: 'Recepcionista', pass: 'test1234' },
  { cedula: 2, nombre: 'Carlos Ramirez', email: 'carlos@datavet.com', rol: 'Veterinario', pass: 'test1234' },
  { cedula: 3, nombre: 'Ana Rodriguez', email: 'ana@datavet.com', rol: 'Veterinario', pass: 'test1234' },
];

async function main() {
  const cfg = getDbConfig();
  console.log(`🔌 Conectando a MySQL en ${cfg.host}:${cfg.port} (BD: ${cfg.database})...`);

  const conn = await mysql.createConnection({
    ...cfg,
    ssl,
    multipleStatements: true,
  });

  // Verificar si ya existen tablas en la BD destino
  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'`,
    [cfg.database]
  );

  if (tables.length > 0) {
    console.log('✅ La base de datos ya contiene las tablas de DataVet. No se realizaron cambios.');
    await conn.end();
    return;
  }

  const schemaPath = path.resolve(__dirname, '../../database/base de datos Datavet.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`No se encontró el archivo SQL en ${schemaPath}`);
  }

  console.log('📋 Aplicando esquema inicial de DataVet...');
  let schemaSql = fs.readFileSync(schemaPath, 'utf8');
  // Evitar cambiar de base de datos si el proveedor usa otro nombre (ej. "railway")
  schemaSql = schemaSql
    .replace(/CREATE DATABASE IF NOT EXISTS\s+`?datavet`?[^;]*;/gi, '')
    .replace(/USE\s+`?datavet`?\s*;/gi, '');

  await conn.query(schemaSql);
  console.log('✅ Esquema y datos base aplicados correctamente.');

  console.log('👥 Sincronizando usuarios demo...');
  for (const u of demoUsuarios) {
    const [roles] = await conn.execute('SELECT id_rol FROM roles WHERE nombre_rol = ? LIMIT 1', [u.rol]);
    if (!roles.length) continue;

    const hash = await bcrypt.hash(u.pass, 12);
    await conn.execute(
      `INSERT INTO usuarios (cedula, nombre, email, password_hash, id_rol, activo)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         password_hash = VALUES(password_hash),
         id_rol = VALUES(id_rol),
         activo = 1`,
      [u.cedula, u.nombre, u.email, hash, roles[0].id_rol]
    );
  }

  await conn.end();
  console.log('🎉 Base de datos en la nube lista para usar.');
}

main().catch((err) => {
  console.error('❌ Error inicializando la BD:', err.message);
  process.exit(1);
});
