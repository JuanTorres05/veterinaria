import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { env } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.disable('x-powered-by');
if (env.trustProxy) app.set('trust proxy', 1);

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin(origin, callback) {
    // Las apps móviles y herramientas servidor-a-servidor no envían Origin.
    if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error('Origen no autorizado por CORS.');
    error.statusCode = 403;
    return callback(error);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));
app.use(express.json({ limit: env.http.jsonLimit }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/api', rateLimit({
  windowMs: env.http.rateLimitWindowMs,
  limit: env.http.rateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
}));
app.use('/api/auth', rateLimit({
  windowMs: env.http.rateLimitWindowMs,
  limit: env.http.authRateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Intenta de nuevo más tarde.' }
}));

app.use('/api', routes);
app.use(errorHandler);

export default app;
