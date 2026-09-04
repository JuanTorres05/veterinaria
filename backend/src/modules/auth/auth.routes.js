// Rutas del módulo de autenticación

import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/auth/login → valida credenciales y genera JWT
router.post('/login', authController.login);

// POST /api/auth/recuperar-password → solicitud de recuperación de contraseña
router.post('/recuperar-password', authController.recuperarPassword);

// GET /api/auth/veterinarios → lista los veterinarios activos (ruta protegida)
router.get('/veterinarios', requireAuth, authController.listarVets);

export default router;
