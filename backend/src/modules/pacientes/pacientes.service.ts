import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearPacienteDto, ActualizarPacienteDto } from '@lis/contracts';

@Injectable()
export class PacientesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CrearPacienteDto) {
    const existe = await this.prisma.paciente.findUnique({
      where: {
        tipo_doc_nro_doc: {
          tipo_doc: data.tipo_doc as any,
          nro_doc: data.nro_doc,
        },
      },
    });

    if (existe) {
      throw new ConflictException(`El paciente con ${data.tipo_doc} ${data.nro_doc} ya existe.`);
    }

    return this.prisma.paciente.create({
      data: {
        ...data,
        tipo_doc: data.tipo_doc as any,
        sexo: data.sexo as string,
        fecha_nacimiento: new Date(data.fecha_nacimiento),
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { nombres: { contains: search, mode: 'insensitive' as any } },
            { apellidos: { contains: search, mode: 'insensitive' as any } },
            { nro_doc: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.paciente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.paciente.count({ where }),
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
    const paciente = await this.prisma.paciente.findUnique({ where: { id } });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }
    return paciente;
  }

  async update(id: string, data: ActualizarPacienteDto) {
    await this.findOne(id);
    const payload: any = { ...data };
    if (data.fecha_nacimiento) {
      payload.fecha_nacimiento = new Date(data.fecha_nacimiento);
    }
    return this.prisma.paciente.update({
      where: { id },
      data: payload,
    });
  }
}
