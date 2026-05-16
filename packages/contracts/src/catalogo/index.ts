import { z } from 'zod';

export enum TipoMuestra {
  SANGRE_TOTAL = 'SANGRE_TOTAL',
  SUERO = 'SUERO',
  PLASMA = 'PLASMA',
  ORINA = 'ORINA',
  HECES = 'HECES',
  CULTIVO = 'CULTIVO',
}

export const CrearPruebaSchema = z.object({
  codigo: z.string().min(2),
  codigo_loinc: z.string().optional().nullable(),
  descripcion: z.string().min(3),
  tipo_muestra: z.nativeEnum(TipoMuestra),
  area: z.string().min(2),
  tiempo_entrega_hrs: z.number().int().min(1),
  requiere_consentimiento: z.boolean().default(false),
});
export type CrearPruebaDto = z.infer<typeof CrearPruebaSchema>;

export const CrearPaqueteSchema = z.object({
  nombre: z.string().min(3),
  descripcion: z.string().optional().nullable(),
  precio_total: z.number().min(0),
  pruebas_ids: z.array(z.string().uuid()).min(1, 'Debe incluir al menos una prueba'),
});
export type CrearPaqueteDto = z.infer<typeof CrearPaqueteSchema>;
