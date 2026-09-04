import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function cleanTestData() {
  console.log("🧹 Limpiando registros de prueba antiguos...");
  
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'datavet',
  });

  try {
    // 0. Eliminar historial clinico de mascotas de prueba
    await conn.query(`
      DELETE h FROM historial_clinico h
      INNER JOIN mascotas m ON m.id = h.mascota_id
      INNER JOIN clientes cl ON cl.id = m.cliente_id
      WHERE cl.nombre LIKE '%prueba%' 
         OR cl.correo LIKE '%test_%' 
         OR cl.correo LIKE '%example.com%'
         OR cl.nombre LIKE 'Ana%'
    `);

    // 1. Eliminar citas asociadas a clientes de prueba
    await conn.query(`
      DELETE c FROM citas c
      INNER JOIN mascotas m ON m.id = c.mascota_id
      INNER JOIN clientes cl ON cl.id = m.cliente_id
      WHERE cl.nombre LIKE '%prueba%' 
         OR cl.correo LIKE '%test_%' 
         OR cl.correo LIKE '%example.com%'
         OR cl.nombre LIKE 'Ana%'
    `);

    // 2. Eliminar mascotas de prueba
    await conn.query(`
      DELETE m FROM mascotas m
      INNER JOIN clientes cl ON cl.id = m.cliente_id
      WHERE cl.nombre LIKE '%prueba%' 
         OR cl.correo LIKE '%test_%' 
         OR cl.correo LIKE '%example.com%'
         OR cl.nombre LIKE 'Ana%'
    `);

    // 3. Eliminar clientes de prueba
    const [res] = await conn.query(`
      DELETE FROM clientes 
      WHERE nombre LIKE '%prueba%' 
         OR correo LIKE '%test_%' 
         OR correo LIKE '%example.com%'
         OR nombre LIKE 'Ana%'
    `);

    console.log(`✅ ${res.affectedRows} registros de prueba eliminados exitosamente.`);

  } catch (err) {
    console.error("❌ Error al limpiar datos:", err);
  } finally {
    await conn.end();
  }
}

cleanTestData();
