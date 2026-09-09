import { z } from 'zod';

export const crearHistorialSchema = z.object({
  fecha: z
    .string({ required_error: 'La fecha es obligatoria.' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'La fecha de la consulta no es válida.',
    })
    // SEGURIDAD I2: una consulta clínica no puede ser en el futuro
    .refine((val) => new Date(val) <= new Date(), {
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
});
