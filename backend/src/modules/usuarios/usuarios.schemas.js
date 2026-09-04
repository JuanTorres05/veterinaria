import { z } from 'zod';

export const crearUsuarioSchema = z.object({
  cedula: z.string().trim().min(6, 'La cédula debe tener al menos 6 caracteres.').max(20),
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(120),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  rol_id: z.coerce.number().int().min(1).max(3, 'El rol seleccionado no es válido (1: Admin, 2: Veterinario, 3: Recepcionista).')
});

export const cambiarPasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.')
});
