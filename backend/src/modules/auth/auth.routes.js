// Rutas del módulo de autenticación

import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/auth/login → valida credenciales y genera JWT
router.post('/login', authController.login);

// POST /api/auth/recuperar-password → solicitud de recuperación de contraseña (no expone datos)
router.post('/recuperar-password', authController.recuperarPassword);

// POST /api/auth/verificar-propietario → verifica si la cédula ya existe para activar o crear cuenta
router.post('/verificar-propietario', authController.verificarPropietario);

// POST /api/auth/registro-propietario → activa cuenta existente o registra nuevo propietario
router.post('/registro-propietario', authController.registroPropietario);

// GET /api/auth/veterinarios → lista los veterinarios activos (ruta protegida)
router.get('/veterinarios', requireAuth, authController.listarVets);

export default router;
