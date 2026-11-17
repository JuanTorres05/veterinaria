import { z } from 'zod';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
]);

export const archivoInputSchema = z.object({
  nombre_archivo: z.string().trim().min(1, 'El nombre del archivo es obligatorio.').max(255),
  mime_type: z
    .string()
    .trim()
    .refine((m) => ALLOWED_MIME_TYPES.has(m.toLowerCase()), {
      message: 'Solo se permiten imágenes (JPG, PNG, WEBP, GIF) o documentos PDF.',
    }),
  tamano_bytes: z.coerce.number().int().nonnegative().max(12 * 1024 * 1024, 'El archivo no debe superar los 12 MB.').optional().nullable(),
  base64_data: z.string().min(10, 'El contenido del archivo es inválido.'),
});

export const crearHistorialSchema = z.object({
  cita_id: z.coerce.number().int().positive().optional().nullable(),
  peso_kg: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    })
    .refine((n) => n === null || (n > 0 && n <= 300), 'El peso debe estar entre 0.1 y 300 kg.'),
  fecha: z
    .string({ required_error: 'La fecha es obligatoria.' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'La fecha de la consulta no es válida.',
    })
    // SEGURIDAD I2: una consulta clínica no puede ser en el futuro (tolerancia 5 min)
    .refine((val) => new Date(val) <= new Date(Date.now() + 5 * 60 * 1000), {
      message: 'La fecha de la consulta no puede ser futura.',
    }),
  motivo: z
    .string({ required_error: 'El motivo de consulta es obligatorio.' })
    .trim()
    .min(3, 'El motivo de consulta debe tener al menos 3 caracteres.')
    .max(255, 'El motivo no puede superar 255 caracteres.'),
  diagnostico: z
    .string({ required_error: 'El diagnóstico médico es obligatorio.' })
    .trim()
    .min(3, 'El diagnóstico médico debe tener al menos 3 caracteres.')
    .max(1000, 'El diagnóstico no puede superar 1000 caracteres.'),
  tratamiento: z
    .string({ required_error: 'El tratamiento es obligatorio.' })
    .trim()
    .min(3, 'El tratamiento asignado debe tener al menos 3 caracteres.')
    .max(1000, 'El tratamiento no puede superar 1000 caracteres.'),
  notas: z.string().trim().max(1000, 'Las notas no pueden superar 1000 caracteres.').optional().nullable(),
  requiere_hospitalizacion: z.boolean().optional().default(false),
  motivo_hospitalizacion: z.string().trim().max(255).optional().nullable(),
  receta: z
    .object({
      indicaciones_generales: z.string().trim().max(500).optional().nullable(),
      medicamentos: z
        .array(
          z.object({
            id_medicamento: z.coerce.number().int().positive('Selecciona un medicamento válido.'),
            dosis: z.string().trim().min(1, 'La dosis es obligatoria.').max(120),
            frecuencia: z.string().trim().max(120).optional().nullable(),
            duracion: z.string().trim().max(120).optional().nullable(),
            instrucciones: z.string().trim().max(500).optional().nullable(),
          })
        )
        .max(15, 'Máximo 15 medicamentos por receta.')
        .default([]),
    })
    .optional()
    .nullable(),
  archivos: z.array(archivoInputSchema).max(10, 'Máximo 10 archivos por consulta.').optional().default([]),
});

export const crearProcedimientoSchema = z.object({
  consulta_id: z.coerce.number().int().positive().optional().nullable(),
  tipo_procedimiento: z
    .string({ required_error: 'El tipo de procedimiento es obligatorio.' })
    .trim()
    .min(3, 'El tipo de procedimiento debe tener al menos 3 caracteres.')
    .max(120, 'El tipo de procedimiento no puede superar 120 caracteres.'),
  descripcion: z
    .string({ required_error: 'La descripción del procedimiento es obligatoria.' })
    .trim()
    .min(3, 'La descripción debe tener al menos 3 caracteres.')
    .max(1500, 'La descripción no puede superar 1500 caracteres.'),
  observaciones: z.string().trim().max(1000, 'Las observaciones no pueden superar 1000 caracteres.').optional().nullable(),
  fecha_procedimiento: z.string().optional().nullable(),
  archivos: z.array(archivoInputSchema).max(10, 'Máximo 10 archivos por procedimiento.').optional().default([]),
});

export const subirArchivosSchema = z.object({
  archivos: z.array(archivoInputSchema).min(1, 'Debes adjuntar al menos un archivo.').max(10, 'Máximo 10 archivos a la vez.'),
});

export const subirFotoMascotaSchema = z.object({
  archivo: z.object({
    nombre_archivo: z.string().trim().min(1).max(255),
    mime_type: z
      .string()
      .trim()
      .refine((m) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(m.toLowerCase()), {
        message: 'La foto de perfil debe ser una imagen (JPG, PNG, WEBP o GIF).',
      }),
    tamano_bytes: z.coerce.number().int().nonnegative().max(10 * 1024 * 1024, 'La foto no debe superar los 10 MB.').optional().nullable(),
    base64_data: z.string().min(10, 'El contenido de la imagen es inválido.'),
  }),
});
