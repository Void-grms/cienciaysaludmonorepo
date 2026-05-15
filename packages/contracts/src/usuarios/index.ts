import { z } from 'zod';
import { Rol } from '../common';

export const CrearUsuarioSchema = z.object({
  nombre: z.string().min(2),
  login: z.string().min(4),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6),
  rol: z.nativeEnum(Rol),
  id_sede: z.string().uuid(),
  id_paciente: z.string().uuid().optional().nullable(),
  id_referencia: z.string().uuid().optional().nullable(),
});

export type CrearUsuarioDto = z.infer<typeof CrearUsuarioSchema>;

export const AsignarPermisosSchema = z.object({
  permisos: z.array(z.string()),
});
export type AsignarPermisosDto = z.infer<typeof AsignarPermisosSchema>;
