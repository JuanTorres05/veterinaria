import { Router } from 'express';
import * as portalController from './portal.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas del portal son exclusivas para propietarios autenticados (rol 'cliente')
router.use(requireAuth, requireRole('cliente'));

router.get('/resumen', portalController.resumen);
router.patch('/perfil', portalController.actualizarPerfil);

router.post('/mascotas', portalController.crearMascota);
router.get('/mascotas/:id', portalController.obtenerMascota);
router.patch('/mascotas/:id/foto', portalController.subirFotoMascota);

router.get('/citas', portalController.listarCitas);
router.get('/disponibilidad', portalController.disponibilidad);
router.post('/citas', portalController.agendarCita);
router.patch('/citas/:id/confirmar', portalController.confirmarCita);
router.patch('/citas/:id/cancelar', portalController.cancelarCita);

export default router;
