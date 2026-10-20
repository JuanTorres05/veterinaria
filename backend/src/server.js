import app from './app.js';
import { env } from './config/env.js';
import pool from './db/pool.js';

async function start() {
  // ── Verificar conexión a la base de datos ──────────────────────────────────
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente.');
    connection.release();
  } catch (err) {
    console.error('❌ No se pudo conectar a MySQL:');
    console.error(`   Host: ${env.db.host}:${env.db.port} | DB: ${env.db.database}`);
    console.error(`   Error: ${err.message}`);
    process.exit(1); // Detiene el servidor si la BD no responde
  }

  // ── Iniciar servidor HTTP ──────────────────────────────────────────────────
  app.listen(env.port, () => {
    console.log(`🚀 DATAVET backend corriendo en http://localhost:${env.port}`);
    console.log(`   Entorno: ${env.nodeEnv}`);
  });
}

start();
