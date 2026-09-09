import { z } from 'zod';

export const crearCitaSchema = z.object({
  mascota_id: z.coerce.number().int().positive('Debe seleccionar una mascota válida.'),
  usuario_id: z.coerce.number().int().positive('Debe seleccionar un profesional veterinario.'),
  fecha_hora: z
    .string({ required_error: 'La fecha y hora de la cita son requeridas.' })
    .refine((val) => {
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      // No permitir agendar citas pasadas (tolerancia de 5 min para latencia)
      const ahora = new Date(Date.now() - 5 * 60 * 1000);
      return d >= ahora;
    }, {
      message: 'No es posible agendar una cita en una fecha u hora que ya pasó.',
    }),
  motivo: z
    .string({ required_error: 'El motivo de la consulta es obligatorio.' })
    .trim()
    .min(3, 'El motivo de la consulta debe tener al menos 3 caracteres.')
    .max(255, 'El motivo no puede superar 255 caracteres.'),
  duracion_min: z.coerce.number().int().min(15, 'La duración mínima es de 15 minutos.').max(240, 'La duración máxima es de 240 minutos.').optional().default(30),
});

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['pendiente', 'atendida', 'cancelada'], {
    errorMap: () => ({ message: 'El estado debe ser: pendiente, atendida o cancelada' }),
  }),
  notas_cancelacion: z.string().trim().max(500, 'Las notas de cancelación no pueden superar 500 caracteres.').optional().nullable(),
});
