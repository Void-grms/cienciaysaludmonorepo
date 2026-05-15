import { z } from 'zod';
import { TipoDocumento } from '../common';

export const CrearPacienteSchema = z.object({
  tipo_doc: z.nativeEnum(TipoDocumento, { required_error: 'El tipo de documento es requerido' }),
  nro_doc: z.string().min(8, 'El documento debe tener al menos 8 caracteres'),
  nombres: z.string().min(2, 'Los nombres son requeridos'),
  apellidos: z.string().min(2, 'Los apellidos son requeridos'),
  fecha_nacimiento: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  sexo: z.enum(['M', 'F', 'O'], { required_error: 'El sexo es requerido' }),
  email: z.string().email('Email inválido').optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  seguro: z.string().optional().nullable(),
});

export type CrearPacienteDto = z.infer<typeof CrearPacienteSchema>;

export const ActualizarPacienteSchema = CrearPacienteSchema.partial();
export type ActualizarPacienteDto = z.infer<typeof ActualizarPacienteSchema>;
