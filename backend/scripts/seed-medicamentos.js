/**
 * seed-medicamentos.js — Catálogo realista de medicamentos veterinarios comunes
 *
 * Inserta de forma idempotente (sin duplicar por nombre) un catálogo completo
 * de medicamentos de uso frecuente en clínica veterinaria.
 *
 * Uso: node scripts/seed-medicamentos.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MEDICAMENTOS = [
  // Antibióticos
  ['Amoxicilina + Ácido Clavulánico', 'Tableta', '250 mg'],
  ['Amoxicilina + Ácido Clavulánico Suspensión', 'Suspensión oral', '250 mg / 5 ml'],
  ['Enrofloxacina', 'Tableta', '50 mg'],
  ['Enrofloxacina Inyectable', 'Solución inyectable', '5% (50 mg/ml)'],
  ['Cefalexina', 'Cápsula / Tableta', '500 mg'],
  ['Doxiciclina', 'Tableta', '100 mg'],
  ['Metronidazol', 'Tableta / Suspensión', '250 mg'],

  // Analgésicos y Antiinflamatorios
  ['Meloxicam Oral', 'Suspensión oral', '1.5 mg/ml'],
  ['Meloxicam Tabletas', 'Tableta', '2 mg'],
  ['Carprofeno', 'Tableta masticable', '75 mg'],
  ['Tramadol Veterinario', 'Gotas orales', '50 mg/ml'],
  ['Prednisolona', 'Tableta', '20 mg'],
  ['Dipirona Veterinaria', 'Solución inyectable', '500 mg/ml'],

  // Antiparasitarios internos y externos
  ['Milbemicina + Praziquantel', 'Tableta', '12.5 mg / 125 mg'],
  ['Ivermectina + Praziquantel + Pirantel', 'Tableta', 'Según rango de peso'],
  ['Fenbendazol', 'Suspensión oral', '10% (100 mg/ml)'],
  ['Fluralaner', 'Tableta masticable', 'Según rango de peso'],
  ['Fipronil + (S)-Metopreno', 'Pipeta spot-on', 'Según rango de peso'],

  // Gastrointestinales y protectores
  ['Maropitant Citrato', 'Tableta', '24 mg'],
  ['Omeprazol', 'Cápsula', '20 mg'],
  ['Sucralfato', 'Suspensión oral', '1 g / 5 ml'],
  ['Metoclopramida', 'Gotas orales', '4 mg/ml'],
  ['Probiótico Gastrointestinal Veterinario', 'Pasta oral / Polvo', 'Multicepa'],

  // Tópicos, dermatológicos, óticos y oftálmicos
  ['Shampoo Medicado Clorhexidina 2%', 'Shampoo dermatológico', '2%'],
  ['Gotas Óticas (Gentamicina + Betametasona + Clotrimazol)', 'Solución ótica', 'Uso tópico ótico'],
  ['Colirio Tobramicina Veterinaria', 'Solución oftálmica', '0.3%'],
  ['Pomada Cicatrizante (Óxido de Zinc + Alantoína)', 'Pomada tópica', 'Uso tópico'],

  // Suplementos y soporte
  ['Condroprotector (Glucosamina + Condroitina)', 'Tableta masticable', '500 mg / 400 mg'],
  ['Complejo B + Hierro', 'Jarabe oral', 'Uso veterinario'],
  ['Solución Lactato de Ringer', 'Solución intravenosa', '500 ml'],
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'datavet',
  });

  let insertados = 0;
  let existentes = 0;

  try {
    await conn.beginTransaction();

    for (const [nombre, presentacion, concentracion] of MEDICAMENTOS) {
      const [[found]] = await conn.execute(
        'SELECT id_medicamento FROM medicamentos WHERE nombre = ? LIMIT 1',
        [nombre]
      );
      if (found) {
        existentes++;
        continue;
      }
      await conn.execute(
        'INSERT INTO medicamentos (nombre, presentacion, concentracion, activo) VALUES (?, ?, ?, 1)',
        [nombre, presentacion, concentracion]
      );
      insertados++;
    }

    await conn.commit();
    const [[{ total }]] = await conn.execute('SELECT COUNT(*) AS total FROM medicamentos WHERE activo = 1');
    console.log(`✅ Catálogo de medicamentos actualizado: ${insertados} nuevos, ${existentes} ya existían. Total activos: ${total}`);
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error al insertar medicamentos:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
