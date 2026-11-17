import { Router } from 'express';
import * as mascotasController from './mascotas.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

// GET /api/mascotas/medicamentos — Catálogo de medicamentos activos para prescripción
router.get('/medicamentos', requireAuth, mascotasController.listarMedicamentos);

// GET /api/mascotas/cliente/:clienteId — Lista mascotas de un cliente
router.get('/cliente/:clienteId', requireAuth, mascotasController.listarPorCliente);

// GET /api/mascotas/:id — Detalle de una mascota con datos del cliente, historial, procedimientos y citas
router.get('/:id', requireAuth, mascotasController.obtenerPorId);

// POST /api/mascotas/:id/historial — Registrar una entrada en el historial clínico (y opcionalmente archivos)
router.post(
  '/:id/historial',
  requireAuth,
  requireRole('admin', 'veterinario'),
  mascotasController.registrarHistorial
);

// POST /api/mascotas/:id/consultas/:consultaId/archivos — Subir fotos/PDFs a una consulta médica existente
router.post(
  '/:id/consultas/:consultaId/archivos',
  requireAuth,
  requireRole('admin', 'veterinario'),
  mascotasController.adjuntarArchivosConsulta
);

// POST /api/mascotas/:id/procedimientos — Registrar un nuevo procedimiento clínico (con fotos/PDFs)
router.post(
  '/:id/procedimientos',
  requireAuth,
  requireRole('admin', 'veterinario'),
  mascotasController.registrarProcedimiento
);

// POST /api/mascotas/:id/procedimientos/:procedimientoId/archivos — Subir fotos/PDFs a un procedimiento existente
router.post(
  '/:id/procedimientos/:procedimientoId/archivos',
  requireAuth,
  requireRole('admin', 'veterinario'),
  mascotasController.adjuntarArchivosProcedimiento
);

// PATCH /api/mascotas/:id/foto — Subir o actualizar foto de perfil de la mascota
router.patch(
  '/:id/foto',
  requireAuth,
  requireRole('admin', 'recepcionista', 'veterinario'),
  mascotasController.subirFoto
);

// DELETE /api/mascotas/:id/archivos/:archivoId — Eliminar un archivo adjunto
router.delete(
  '/:id/archivos/:archivoId',
  requireAuth,
  requireRole('admin', 'veterinario'),
  mascotasController.eliminarArchivo
);

export default router;
