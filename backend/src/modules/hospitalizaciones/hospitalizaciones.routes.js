import { Router } from 'express';
import * as hospitalizacionesController from './hospitalizaciones.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, hospitalizacionesController.listar);

router.post(
  '/',
  requireAuth,
  requireRole('admin', 'veterinario'),
  hospitalizacionesController.crear
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin', 'veterinario'),
  hospitalizacionesController.actualizar
);

export default router;
