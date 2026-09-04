import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import * as usuariosController from './usuarios.controller.js';

const router = Router();

// Todas las rutas de administración de usuarios requieren rol 'admin'
router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/', usuariosController.listar);
router.post('/', usuariosController.crear);
router.patch('/:id/estado', usuariosController.cambiarEstado);
router.put('/:id/password', usuariosController.cambiarPassword);

export default router;
