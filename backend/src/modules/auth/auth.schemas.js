// Esquemas de validación para el módulo auth
// Usamos Zod para asegurarnos de que el body tenga lo que necesitamos
// Si algo no cumple, Zod lanza un error que el error.middleware.js captura y formatea

import { z } from 'zod';

// Helper reutilizable: acepta cédula como número o string y la convierte a string
const cedulaField = z.coerce.string().min(1, 'La cédula es obligatoria.');

// Validación del formulario de login
// OJO: la contraseña mínimo 6 chars para cumplir la regla de negocio de HU-01
export const loginSchema = z.object({
  cedula: cedulaField,
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.')
});

// Validación del formulario de recuperación de contraseña
export const recuperarPasswordSchema = z.object({
  cedula: cedulaField,
  correo: z.string().email('El correo electrónico no es válido.')
});

// Paso 1 – Verificar que la cédula existe antes de mostrar el form de nueva contraseña
export const verificarCedulaSchema = z.object({
  cedula: cedulaField
});

// Paso 2 – Cambiar la contraseña (cédula ya verificada + nueva contraseña)
export const cambiarPasswordSchema = z.object({
  cedula: cedulaField,
  nuevaPassword: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmarPassword: z
    .string()
    .min(6, 'La confirmación debe tener al menos 6 caracteres.')
}).refine((data) => data.nuevaPassword === data.confirmarPassword, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmarPassword']
});

