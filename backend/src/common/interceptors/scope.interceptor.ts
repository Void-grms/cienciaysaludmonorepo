import { CallHandler, ExecutionContext, Injectable, NestInterceptor, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Rol } from '@prisma/client';

@Injectable()
export class ScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    // Si es PACIENTE o REFERENCIA, inyectamos su scope en req.query para que los controllers/services lo usen.
    if (user.rol === Rol.PACIENTE) {
      if (!user.id_paciente) {
        throw new ForbiddenException('Paciente sin ID asociado.');
      }
      request.query = { ...request.query, id_paciente: user.id_paciente };
    } else if (user.rol === Rol.REFERENCIA) {
      if (!user.id_referencia) {
        throw new ForbiddenException('Referencia sin ID asociado.');
      }
      request.query = { ...request.query, id_referencia: user.id_referencia };
    }

    return next.handle();
  }
}
