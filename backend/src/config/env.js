// Configuración centralizada de variables de entorno
// Carga y valida variables con dotenv, proveyendo valores por defecto seguros para desarrollo

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz de backend de forma robusta
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback en caso de ejecución directa

// Lista de secretos inseguros no permitidos en producción
const INSECURE_SECRETS = new Set(['', 'replace_me', 'dev_secret_change_me', 'reemplaza_con_un_secreto_seguro_en_produccion']);

const jwtSecret = process.env.JWT_SECRET ?? '';
const nodeEnv = process.env.NODE_ENV || 'development';

const rawOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// En desarrollo, si CORS_ORIGINS no está definido, permitir Vite por defecto
const allowedOrigins = rawOrigins.length > 0
  ? rawOrigins
  : (nodeEnv === 'development' ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'] : []);

if (nodeEnv === 'production' && (INSECURE_SECRETS.has(jwtSecret) || jwtSecret.length < 32)) {
  throw new Error(
    '[config] JWT_SECRET no está definido o usa un valor inseguro. ' +
    'Define la variable de entorno JWT_SECRET con al menos 32 caracteres antes de arrancar en producción.'
  );
}

if (nodeEnv === 'production' && allowedOrigins.length === 0) {
  throw new Error('[config] CORS_ORIGINS es obligatorio en producción.');
}

// Exportamos todo en un solo objeto inmutable
export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv,
  trustProxy: process.env.TRUST_PROXY === 'true',
  allowedOrigins,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'datavet'
  },
  jwt: {
    secret: jwtSecret || 'datavet_dev_jwt_secret_key_super_secure_for_local_testing_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },
  http: {
    jsonLimit: process.env.JSON_BODY_LIMIT || '25mb',
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || (nodeEnv === 'development' ? 2000 : 300)),
    authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || (nodeEnv === 'development' ? 100 : 20))
  }
};
