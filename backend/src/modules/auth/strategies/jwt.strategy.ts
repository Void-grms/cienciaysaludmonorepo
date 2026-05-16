import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'change-me',
    });
  }

  async validate(payload: any) {
    return { 
      sub: payload.sub, 
      rol: payload.rol, 
      id_sede: payload.id_sede, 
      id_paciente: payload.id_paciente, 
      id_referencia: payload.id_referencia,
      permisos: payload.permisos
    };
  }
}
