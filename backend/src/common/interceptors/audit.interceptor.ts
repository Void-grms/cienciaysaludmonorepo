import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, ip, body } = req;

    return next.handle().pipe(
      tap(async () => {
        // Solo registramos mutaciones (POST, PATCH, PUT, DELETE)
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          let accion = 'MODIFICAR';
          if (method === 'POST') accion = 'CREAR';
          if (method === 'DELETE') accion = 'ELIMINAR';
          
          if (url.includes('login')) accion = 'LOGIN';
          if (url.includes('logout')) accion = 'LOGOUT';
          if (url.includes('liberar')) accion = 'LIBERAR';

          // Asíncronamente guardamos en BD
          try {
            await this.prisma.auditoria.create({
              data: {
                accion,
                entidad: url.split('/')[3] || 'desconocida', // asume /api/v1/entidad
                id_entidad: req.params.id || 'N/A',
                id_usuario: user?.sub || null,
                ip_origen: ip,
                detalle_json: body ? JSON.stringify(body) : undefined,
              },
            });
          } catch (e) {
            console.error('Error guardando log de auditoría', e);
          }
        }
      }),
    );
  }
}
