import mysql from 'mysql2/promise';

async function testConnection() {
  const ports = [3306, 3307];
  const passwords = ['', 'root', 'admin', '1234'];

  for (const port of ports) {
    for (const password of passwords) {
      try {
        console.log(`Intentando conectar a 127.0.0.1:${port} con usuario 'root' y pass '${password}'...`);
        const conn = await Promise.race([
          mysql.createConnection({
            host: '127.0.0.1',
            port,
            user: 'root',
            password,
            connectTimeout: 2000,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de conexión (2s)')), 2000)),
        ]);
        console.log(`✅ ¡CONEXIÓN EXITOSA! Port: ${port}, Pass: "${password}"`);
        await conn.end();
        return { port, password };
      } catch (err) {
        console.log(`❌ Falló 127.0.0.1:${port} (Pass: "${password}"):`, err.message);
      }
    }
  }
  console.log('⚠️ No se pudo conectar a ningún puerto con las contraseñas probadas.');
  return null;
}

testConnection().then((res) => {
  if (res) {
    console.log('\nRESULTADO FINAL:', JSON.stringify(res));
  }
  process.exit(0);
});
