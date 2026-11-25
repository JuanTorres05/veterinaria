import { z } from 'zod';

export const actualizarPerfilSchema = z.object({
  telefono: z
    .string()
    .trim()
    .min(7, 'Ingresa un número telefónico válido (mínimo 7 dígitos).')
    .max(30),
  correo: z.string().trim().email('Ingresa un correo electrónico válido.').max(190),
  direccion: z
    .string({ required_error: 'La dirección de residencia es obligatoria.' })
    .trim()
    .min(5, 'La dirección de residencia es obligatoria (mínimo 5 caracteres).')
    .max(255),
});

export const crearMascotaPortalSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre de la mascota debe tener al menos 2 caracteres.').max(100),
  especie: z.string().trim().min(2, 'Selecciona una especie.').max(60),
  raza: z.string().trim().min(2, 'La raza es obligatoria.').max(100),
  sexo: z.enum(['Macho', 'Hembra', 'Desconocido']).optional().default('Desconocido'),
  fechaNacimiento: z.string().optional().nullable(),
  pesoKg: z.union([z.number().positive().max(300), z.string(), z.null()]).optional(),
  color: z.string().trim().max(80).optional().nullable(),
  observaciones: z.string().trim().max(500).optional().nullable(),
});

export const agendarCitaPortalSchema = z.object({
  mascota_id: z.coerce.number().int().positive('Selecciona una mascota válida.'),
  veterinario_id: z.coerce.number().int().positive('Selecciona un veterinario válido.'),
  fecha_hora: z.string().trim().min(16, 'Selecciona una fecha y hora válidas.'),
  motivo: z.string().trim().min(3, 'Indica el motivo de la consulta (mínimo 3 caracteres).').max(255),
});

export const subirFotoPortalSchema = z.object({
  nombre_archivo: z.string().trim().min(1).max(255).optional(),
  mime_type: z.string().trim().min(1),
  base64_data: z.string().min(20),
});

export const cancelarCitaPortalSchema = z.object({
  motivo_cancelacion: z
    .string()
    .trim()
    .min(3, 'Por favor indica el motivo de cancelación (mínimo 3 caracteres).')
    .max(300, 'El motivo de cancelación no puede superar 300 caracteres.'),
});
