import { z } from 'zod';

const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]+$/;
const cedulaRegex = /^[a-zA-Z0-9-]+$/;

export const crearUsuarioSchema = z.object({
  cedula: z
    .string({ required_error: 'La cédula es obligatoria.' })
    .trim()
    .min(6, 'La cédula debe tener al menos 6 caracteres.')
    .max(20, 'La cédula no puede superar 20 caracteres.')
    .regex(cedulaRegex, 'La cédula solo puede contener números, letras o guiones.'),
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(120, 'El nombre no puede superar 120 caracteres.')
    .regex(nombreRegex, 'El nombre solo puede contener letras y espacios.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .max(100, 'La contraseña no puede superar 100 caracteres.'),
  rol_id: z.coerce
    .number({ required_error: 'El rol es obligatorio.' })
    .int()
    .min(1)
    .max(3, 'El rol seleccionado no es válido (1: Admin, 2: Veterinario, 3: Recepcionista).')
});

export const cambiarPasswordSchema = z.object({
  password: z
    .string({ required_error: 'La nueva contraseña es obligatoria.' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .max(100, 'La contraseña no puede superar 100 caracteres.')
});

// SEGURIDAD C2: validar que activo sea boolean estricto antes de tocar la BD
export const cambiarEstadoSchema = z.object({
  activo: z.boolean({ required_error: 'El campo activo es obligatorio.', invalid_type_error: 'El campo activo debe ser verdadero o falso.' })
});
