// Validaciones del módulo clientes con Zod
// Registro unificado de cliente y mascotas (HU-02)

import { z } from 'zod';

// Regex para teléfono: admite dígitos, +, -, espacios - entre 7 y 15 caracteres
const telefonoRegex = /^[0-9+\-\s]{7,15}$/;
const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]+$/;
const cedulaRegex = /^[a-zA-Z0-9-]+$/;

export const mascotaSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre de la mascota es obligatorio.' })
    .trim()
    .min(2, 'El nombre de la mascota debe tener al menos 2 caracteres.')
    .max(80, 'El nombre de la mascota no puede superar 80 caracteres.'),
  especie: z
    .string({ required_error: 'La especie es obligatoria.' })
    .trim()
    .min(2, 'La especie es obligatoria.')
    .max(50, 'La especie no puede superar 50 caracteres.'),
  raza: z
    .string({ required_error: 'La raza es obligatoria.' })
    .trim()
    .min(2, 'La raza es obligatoria.')
    .max(80, 'La raza no puede superar 80 caracteres.'),
  sexo: z.enum(['Macho', 'Hembra', 'Desconocido']).optional().default('Desconocido'),
  fechaNacimiento: z
    .string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 35);
      return d <= today && d >= minDate;
    }, 'La fecha de nacimiento no puede ser futura ni mayor a 35 años.'),
  pesoKg: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    })
    .refine((n) => n === null || (n > 0 && n <= 300), 'El peso debe ser un número positivo entre 0.1 y 300 kg.'),
  color: z.string().trim().max(80, 'El color no puede superar 80 caracteres.').optional().nullable(),
  foto: z
    .object({
      nombre_archivo: z.string().trim().min(1).max(255),
      mime_type: z
        .string()
        .trim()
        .refine((m) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(m.toLowerCase()), {
          message: 'La foto debe ser una imagen (JPG, PNG, WEBP o GIF).',
        }),
      tamano_bytes: z.coerce.number().int().nonnegative().max(10 * 1024 * 1024, 'La foto no debe superar 10 MB.').optional().nullable(),
      base64_data: z.string().min(10, 'El contenido de la imagen es inválido.'),
    })
    .optional()
    .nullable(),
});

export const registrarClienteMascotaSchema = z.object({
  // Sección del propietario
  cliente: z.object({
    nombre: z
      .string({ required_error: 'El nombre del cliente es obligatorio.' })
      .trim()
      .min(3, 'El nombre del cliente debe tener al menos 3 caracteres.')
      .max(120, 'El nombre no puede superar 120 caracteres.')
      .regex(nombreRegex, 'El nombre solo puede contener letras, tildes y espacios.'),
    cedula: z
      .string({ required_error: 'La cédula es obligatoria.' })
      .trim()
      .min(5, 'La cédula debe tener al menos 5 caracteres.')
      .max(20, 'La cédula no puede superar 20 caracteres.')
      .regex(cedulaRegex, 'La cédula solo puede contener números, letras o guiones.'),
    direccion: z
      .string({ required_error: 'La dirección de residencia es obligatoria.' })
      .trim()
      .min(5, 'La dirección de residencia es obligatoria (mínimo 5 caracteres).')
      .max(255, 'La dirección no puede superar 255 caracteres.'),
    telefono: z
      .string({ required_error: 'El teléfono es obligatorio.' })
      .trim()
      .regex(telefonoRegex, 'El teléfono debe tener entre 7 y 15 caracteres (dígitos, +, -, espacios).')
      .refine((val) => val.replace(/\D/g, '').length >= 7, 'El teléfono debe contener al menos 7 números.'),
    correo: z
      .string({ required_error: 'El correo electrónico es obligatorio.' })
      .trim()
      .email('El correo no tiene un formato válido (ej. usuario@correo.com).')
      .max(120, 'El correo no puede superar 120 caracteres.')
      .transform((v) => v.toLowerCase().trim()),
  }),

  // Array de mascotas (mínimo 1, máximo 10 por registro)
  mascotas: z
    .array(mascotaSchema)
    .min(1, 'Debes registrar al menos una mascota.')
    .max(10, 'No puedes registrar más de 10 mascotas a la vez.'),
});
