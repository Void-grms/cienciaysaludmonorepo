import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearUsuarioDto, AsignarPermisosDto } from '@lis/contracts';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(data: CrearUsuarioDto) {
    const existe = await this.prisma.usuario.findUnique({ where: { login: data.login } });
    if (existe) throw new ConflictException('El login ya está en uso');

    const hash_password = await bcrypt.hash(data.password, 10);

    return this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        login: data.login,
        email: data.email,
        hash_password,
        rol: data.rol as any,
        id_sede: data.id_sede,
        id_paciente: data.id_paciente,
        id_referencia: data.id_referencia,
        mfa_habilitado: data.rol === 'ADMINISTRADOR', // Forzado
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? { nombre: { contains: search, mode: 'insensitive' as any } } : {};

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        select: { id: true, nombre: true, login: true, rol: true, estado: true, id_sede: true },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { data, meta: { total, page, last_page: Math.ceil(total / limit) } };
  }

  async updateEstado(id: string, estado: string) {
    return this.prisma.usuario.update({
      where: { id },
      data: { estado: estado as any },
      select: { id: true, nombre: true, estado: true },
    });
  }

  async setPermisos(id: string, data: AsignarPermisosDto) {
    // Primero borramos los anteriores
    await this.prisma.permisoUsuario.deleteMany({ where: { id_usuario: id } });
    // Insertamos los nuevos
    if (data.permisos.length > 0) {
      await this.prisma.permisoUsuario.createMany({
        data: data.permisos.map((p) => ({ id_usuario: id, permiso: p })),
      });
    }
    return { success: true };
  }
}
