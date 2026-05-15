import { z } from 'zod';
import { TipoReferencia, TipoEntrega } from '../common';

export const CrearReferenciaSchema = z.object({
  tipo: z.nativeEnum(TipoReferencia),
  nombre: z.string().min(2, 'El nombre es requerido'),
  ruc: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  id_convenio: z.string().uuid().optional().nullable(),
  entrega_por_defecto: z.nativeEnum(TipoEntrega).default(TipoEntrega.AMBOS),
});

export type CrearReferenciaDto = z.infer<typeof CrearReferenciaSchema>;

export const ActualizarReferenciaSchema = CrearReferenciaSchema.partial();
export type ActualizarReferenciaDto = z.infer<typeof ActualizarReferenciaSchema>;

export const CrearMedicoSchema = z.object({
  nombres: z.string().min(2),
  apellidos: z.string().min(2),
  cmp: z.string().min(4, 'El CMP es requerido'),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export type CrearMedicoDto = z.infer<typeof CrearMedicoSchema>;
