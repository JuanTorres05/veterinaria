import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import clientesRoutes from '../modules/clientes/clientes.routes.js';
import mascotasRoutes from '../modules/mascotas/mascotas.routes.js';
import citasRoutes from '../modules/citas/citas.routes.js';
import reportesRoutes from '../modules/reportes/reportes.routes.js';
import usuariosRoutes from '../modules/usuarios/usuarios.routes.js';
import hospitalizacionesRoutes from '../modules/hospitalizaciones/hospitalizaciones.routes.js';
import portalRoutes from '../modules/portal/portal.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/clientes', clientesRoutes);
router.use('/mascotas', mascotasRoutes);
router.use('/citas', citasRoutes);
router.use('/reportes', reportesRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/hospitalizaciones', hospitalizacionesRoutes);
router.use('/portal', portalRoutes);

export default router;

