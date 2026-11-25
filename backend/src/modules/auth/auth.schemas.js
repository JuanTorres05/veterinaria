import { z } from 'zod';

const cedulaField = z.coerce.string().trim().min(1, 'La cédula es obligatoria.');

export const loginSchema = z.object({
  cedula: cedulaField,
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const recuperarPasswordSchema = z.object({
  cedula: cedulaField,
  correo: z.string().email('El correo electrónico no es válido.'),
});

export const verificarCedulaSchema = z.object({
  cedula: cedulaField,
});

export const cambiarPasswordSchema = z
  .object({
    cedula: cedulaField,
    nuevaPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmarPassword: z.string().min(6, 'La confirmación debe tener al menos 6 caracteres.'),
  })
  .refine((data) => data.nuevaPassword === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmarPassword'],
  });

export const verificarPropietarioSchema = z.object({
  cedula: z.coerce
    .string()
    .trim()
    .min(3, 'Ingresa un número de cédula válido.')
    .max(20, 'La cédula es demasiado larga.'),
});

const mascotaOpcionalSchema = z
  .object({
    nombre: z.string().trim().min(2, 'El nombre de la mascota debe tener al menos 2 caracteres.'),
    especie: z.string().trim().min(2, 'Selecciona una especie.'),
    raza: z.string().trim().max(100).optional().nullable(),
    sexo: z.enum(['Macho', 'Hembra', 'Desconocido']).optional().default('Desconocido'),
    fechaNacimiento: z.string().optional().nullable(),
    pesoKg: z.union([z.number().positive().max(300), z.string(), z.null()]).optional(),
    color: z.string().trim().max(80).optional().nullable(),
  })
  .optional()
  .nullable();

export const registroPropietarioSchema = z
  .object({
    modo: z.enum(['activar', 'nuevo']),
    cedula: z.coerce.string().trim().min(3, 'La cédula es obligatoria.').max(20),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmarPassword: z.string().min(6, 'Confirma tu contraseña.'),
    // Para modo 'activar'
    verificacion: z.string().trim().optional(),
    correoAlternativo: z.string().trim().email('Correo electrónico no válido.').optional().or(z.literal('')),
    // Para modo 'nuevo'
    nombre: z.string().trim().optional(),
    telefono: z.string().trim().optional(),
    correo: z.string().trim().optional(),
    direccion: z.string().trim().max(255).optional().nullable(),
    mascota: mascotaOpcionalSchema,
  })
  .refine((d) => d.password === d.confirmarPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmarPassword'],
  });
