import * as mascotasService from './mascotas.service.js';
import {
  crearHistorialSchema,
  crearProcedimientoSchema,
  subirArchivosSchema,
  subirFotoMascotaSchema,
} from './mascotas.schemas.js';

export async function listarMedicamentos(req, res, next) {
  try {
    const medicamentos = await mascotasService.listarMedicamentos();
    return res.status(200).json(medicamentos);
  } catch (err) {
    return next(err);
  }
}

export async function listarPorCliente(req, res, next) {
  try {
    const clienteId = Number(req.params.clienteId);
    if (!Number.isInteger(clienteId) || clienteId < 1) {
      return res.status(400).json({ message: 'El ID de cliente no es válido.' });
    }
    const mascotas = await mascotasService.listarPorCliente(clienteId);
    return res.status(200).json(mascotas);
  } catch (err) {
    return next(err);
  }
}

export async function obtenerPorId(req, res, next) {
  try {
    const mascotaId = Number(req.params.id);
    if (!Number.isInteger(mascotaId) || mascotaId < 1) {
      return res.status(400).json({ message: 'El ID de mascota no es válido.' });
    }
    const mascota = await mascotasService.obtenerPorId(mascotaId);
    return res.status(200).json(mascota);
  } catch (err) {
    return next(err);
  }
}

export async function registrarHistorial(req, res, next) {
  try {
    const mascotaId = Number(req.params.id);
    if (!Number.isInteger(mascotaId) || mascotaId < 1) {
      return res.status(400).json({ message: 'El ID de mascota no es válido.' });
    }

    const payload = crearHistorialSchema.parse(req.body);
    const usuarioId = req.user.sub;

    const result = await mascotasService.crearHistorial({
      mascota_id: mascotaId,
      usuario_id: usuarioId,
      ...payload,
    });

    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function adjuntarArchivosConsulta(req, res, next) {
  try {
    const mascotaId = Number(req.params.id);
    const consultaId = Number(req.params.consultaId);
    if (!Number.isInteger(mascotaId) || mascotaId < 1 || !Number.isInteger(consultaId) || consultaId < 1) {
      return res.status(400).json({ message: 'ID de mascota o consulta no válido.' });
    }

    const { archivos } = subirArchivosSchema.parse(req.body);
    const usuarioId = req.user.sub;

    const result = await mascotasService.subirArchivosConsulta({
      mascota_id: mascotaId,
      consulta_id: consultaId,
      usuario_id: usuarioId,
      archivos,
    });

    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function registrarProcedimiento(req, res, next) {
  try {
    const mascotaId = Number(req.params.id);
    if (!Number.isInteger(mascotaId) || mascotaId < 1) {
      return res.status(400).json({ message: 'El ID de mascota no es válido.' });
    }

    const payload = crearProcedimientoSchema.parse(req.body);
    const usuarioId = req.user.sub;

    const result = await mascotasService.crearProcedimiento({
      mascota_id: mascotaId,
      usuario_id: usuarioId,
      ...payload,
    });

    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function adjuntarArchivosProcedimiento(req, res, next) {
  try {
    const procedimientoId = Number(req.params.procedimientoId);
    if (!Number.isInteger(procedimientoId) || procedimientoId < 1) {
      return res.status(400).json({ message: 'ID de procedimiento no válido.' });
    }

    const { archivos } = subirArchivosSchema.parse(req.body);
    const usuarioId = req.user.sub;

    const result = await mascotasService.subirArchivosProcedimiento({
      procedimiento_id: procedimientoId,
      usuario_id: usuarioId,
      archivos,
    });

    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function subirFoto(req, res, next) {
  try {
    const mascotaId = Number(req.params.id);
    if (!Number.isInteger(mascotaId) || mascotaId < 1) {
      return res.status(400).json({ message: 'El ID de mascota no es válido.' });
    }
    const { archivo } = subirFotoMascotaSchema.parse(req.body);
    const result = await mascotasService.actualizarFotoMascota({ mascota_id: mascotaId, archivo });
    if (!result) {
      return res.status(404).json({ message: 'Mascota no encontrada.' });
    }
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function eliminarArchivo(req, res, next) {
  try {
    const archivoId = Number(req.params.archivoId);
    if (!Number.isInteger(archivoId) || archivoId < 1) {
      return res.status(400).json({ message: 'ID de archivo no válido.' });
    }

    const eliminado = await mascotasService.eliminarArchivo({ archivo_id: archivoId });
    if (!eliminado) {
      return res.status(404).json({ message: 'El archivo no existe.' });
    }
    return res.status(200).json({ message: 'Archivo eliminado correctamente.' });
  } catch (err) {
    return next(err);
  }
}
