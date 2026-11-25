/**
 * migrate-portal.js — Migración idempotente para habilitar el Portal del Propietario
 * 1. Inserta el rol 'Cliente' si no existe
 * 2. Agrega clientes.id_usuario (FK única a usuarios.id_usuario) si no existe
 *
 * Uso: node scripts/migrate-portal.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'datavet',
  });

  try {
    const [r] = await conn.query("SELECT id_rol FROM roles WHERE nombre_rol = 'Cliente'");
    if (!r.length) {
      await conn.query(
        "INSERT INTO roles (nombre_rol, descripcion) VALUES ('Cliente', 'Propietario de mascotas con acceso al portal')"
      );
      console.log('✅ Rol Cliente creado.');
    } else {
      console.log('ℹ️ Rol Cliente ya existe.');
    }

    const [cols] = await conn.query("SHOW COLUMNS FROM clientes LIKE 'id_usuario'");
    if (!cols.length) {
      await conn.query(
        'ALTER TABLE clientes ADD COLUMN id_usuario int(10) unsigned DEFAULT NULL AFTER id_cliente, ADD UNIQUE KEY uq_clientes_usuario (id_usuario), ADD CONSTRAINT fk_clientes_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE SET NULL ON UPDATE CASCADE'
      );
      console.log('✅ Columna clientes.id_usuario agregada.');
    } else {
      console.log('ℹ️ Columna clientes.id_usuario ya existe.');
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('❌ Error en migración:', err.message);
  process.exit(1);
});
