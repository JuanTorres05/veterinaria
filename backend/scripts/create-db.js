import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('Creating database if not exists...');
  await conn.query('CREATE DATABASE IF NOT EXISTS datavet;');
  console.log('Database datavet created or already exists.');

  await conn.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
