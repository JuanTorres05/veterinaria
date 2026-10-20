// Rutas del módulo de autenticación

import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/auth/login → valida credenciales y genera JWT
router.post('/login', authController.login);

// POST /api/auth/recuperar-password → solicitud de recuperación de contraseña
router.post('/recuperar-password', authController.recuperarPassword);

// POST /api/auth/verificar-cedula → Paso 1: confirma que la cédula existe (pública)
router.post('/verificar-cedula', authController.verificarCedula);

// POST /api/auth/cambiar-password → Paso 2: actualiza la contraseña por cédula (pública)
router.post('/cambiar-password', authController.cambiarPassword);

// GET /api/auth/veterinarios → lista los veterinarios activos (ruta protegida)
router.get('/veterinarios', requireAuth, authController.listarVets);

export default router;

