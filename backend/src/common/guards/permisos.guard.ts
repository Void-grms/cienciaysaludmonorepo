import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_KEY } from '../decorators/permisos.decorator';
import { Rol } from '@prisma/client';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermisos = this.reflector.getAllAndOverride<string[]>(PERMISOS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermisos) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    
    // Solo el Administrador usa permisos finos
    if (!user || user.rol !== Rol.ADMINISTRADOR) {
      throw new ForbiddenException('Acceso denegado. Se requiere rol de Administrador.');
    }

    const userPermisos: string[] = user.permisos || [];
    const hasPermiso = requiredPermisos.some((permiso) => userPermisos.includes(permiso));
    
    if (!hasPermiso) {
      throw new ForbiddenException(`Acceso denegado. Requiere el permiso: ${requiredPermisos.join(' o ')}`);
    }

    return true;
  }
}
