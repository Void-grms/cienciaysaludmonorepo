import { z } from 'zod';

export const AtencionItemSchema = z.object({
  id_producto: z.string().uuid(),
  tipo: z.enum(['PRUEBA', 'PAQUETE']),
  precio: z.number().min(0),
});

export const CrearAtencionSchema = z.object({
  id_paciente: z.string().uuid(),
  id_referencia: z.string().uuid().optional().nullable(),
  id_medico_referidor: z.string().uuid().optional().nullable(),
  items: z.array(AtencionItemSchema).min(1, 'Debe incluir al menos un examen o paquete'),
  descuento: z.number().min(0).default(0),
  observaciones: z.string().optional().nullable(),
});

export type CrearAtencionDto = z.infer<typeof CrearAtencionSchema>;

export const ResultadoItemSchema = z.object({
  id_detalle: z.string().uuid(),
  resultado: z.string().min(1, 'El resultado no puede estar vacío'),
});

export const IngresarResultadosSchema = z.object({
  resultados: z.array(ResultadoItemSchema).min(1),
});

export type IngresarResultadosDto = z.infer<typeof IngresarResultadosSchema>;
