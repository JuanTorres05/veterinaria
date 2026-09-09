import pool from './pool.js';

/**
 * Ejecuta una unidad de trabajo atómica. La capa de aplicación decide cuándo
 * usar una transacción; los repositorios solo reciben el ejecutor de consultas.
 */
export async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
