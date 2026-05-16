import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '@lis/contracts';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(login: string, pass: string): Promise<any> {
    const user = await this.prisma.usuario.findUnique({
      where: { login },
      include: { permisos: true }
    });
    if (user && await bcrypt.compare(pass, user.hash_password)) {
      const { hash_password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Para el MVP, saltamos MFA y generamos el token directamente.
    const payload = { 
      sub: user.id, 
      rol: user.rol,
      id_sede: user.id_sede,
      id_paciente: user.id_paciente,
      id_referencia: user.id_referencia,
      permisos: user.permisos.map((p: any) => p.permiso)
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
