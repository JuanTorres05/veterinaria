import { z } from 'zod';

export const crearHospitalizacionSchema = z.object({
  mascota_id: z.coerce.number().int().positive('Debe seleccionar una mascota válida.'),
  veterinario_id: z.coerce.number().int().positive().optional().nullable(),
  consulta_id: z.coerce.number().int().positive().optional().nullable(),
  motivo: z
    .string({ required_error: 'El motivo de ingreso es obligatorio.' })
    .trim()
    .min(3, 'El motivo debe tener al menos 3 caracteres.')
    .max(255, 'El motivo no puede superar 255 caracteres.'),
  tratamientos_realizados: z
    .string()
    .trim()
    .max(1500, 'Los tratamientos no pueden superar 1500 caracteres.')
    .optional()
    .nullable(),
  observaciones: z
    .string()
    .trim()
    .max(1500, 'Las observaciones no pueden superar 1500 caracteres.')
    .optional()
    .nullable(),
});

export const actualizarHospitalizacionSchema = z.object({
  tratamientos_realizados: z
    .string()
    .trim()
    .max(1500, 'Los tratamientos no pueden superar 1500 caracteres.')
    .optional()
    .nullable(),
  observaciones: z
    .string()
    .trim()
    .max(1500, 'Las observaciones no pueden superar 1500 caracteres.')
    .optional()
    .nullable(),
  notas_alta: z
    .string()
    .trim()
    .max(1500, 'Las notas de alta no pueden superar 1500 caracteres.')
    .optional()
    .nullable(),
  estado: z.enum(['Activa', 'Finalizada', 'Cancelada']).optional(),
});
