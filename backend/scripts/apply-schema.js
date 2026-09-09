import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function main() {
  console.log('Connecting to MySQL database...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'datavet',
    multipleStatements: true,
  });

  const schemaPath = path.resolve('../database/schema.sql');
  console.log(`Reading schema from ${schemaPath}...`);
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Dividir por declaraciones SQL individuales
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Applying ${statements.length} schema statements...`);
  for (const stmt of statements) {
    if (stmt) {
      await conn.query(stmt);
    }
  }

  console.log('Schema applied successfully.');
  await conn.end();
}

main().catch((err) => {
  console.error('Error applying schema:', err.message);
  process.exit(1);
});
