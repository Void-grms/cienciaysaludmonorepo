import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearReferenciaDto, ActualizarReferenciaDto, CrearMedicoDto } from '@lis/contracts';

@Injectable()
export class ReferenciasService {
  constructor(private prisma: PrismaService) {}

  async create(data: CrearReferenciaDto) {
    return this.prisma.referencia.create({
      data: {
        tipo: data.tipo as any,
        nombre: data.nombre,
        ruc: data.ruc,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        id_convenio: data.id_convenio,
        entrega_por_defecto: data.entrega_por_defecto as any,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' as any } },
            { ruc: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.referencia.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: { convenio: true, medicos: true },
      }),
      this.prisma.referencia.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const ref = await this.prisma.referencia.findUnique({
      where: { id },
      include: { medicos: true, convenio: true },
    });
    if (!ref) throw new NotFoundException('Referencia no encontrada');
    return ref;
  }

  async update(id: string, data: ActualizarReferenciaDto) {
    await this.findOne(id);
    return this.prisma.referencia.update({
      where: { id },
      data: data as any,
    });
  }

  async addMedico(id_referencia: string, data: CrearMedicoDto) {
    await this.findOne(id_referencia);
    return this.prisma.medicoReferidor.create({
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        cmp: data.cmp,
        telefono: data.telefono,
        email: data.email,
        id_referencia,
      },
    });
  }
}
