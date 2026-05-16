import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearPruebaDto } from '@lis/contracts';

@Injectable()
export class PruebasService {
  constructor(private prisma: PrismaService) {}

  async create(data: CrearPruebaDto) {
    const existe = await this.prisma.prueba.findUnique({ where: { codigo: data.codigo } });
    if (existe) throw new ConflictException(`La prueba con código ${data.codigo} ya existe`);

    return this.prisma.prueba.create({
      data: {
        codigo: data.codigo,
        codigo_loinc: data.codigo_loinc,
        descripcion: data.descripcion,
        tipo_muestra: data.tipo_muestra as any,
        area: data.area,
        tiempo_entrega_hrs: data.tiempo_entrega_hrs,
        requiere_consentimiento: data.requiere_consentimiento,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? {
      OR: [
        { codigo: { contains: search, mode: 'insensitive' as any } },
        { descripcion: { contains: search, mode: 'insensitive' as any } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.prueba.findMany({
        where, skip, take: limit, orderBy: { descripcion: 'asc' }
      }),
      this.prisma.prueba.count({ where }),
    ]);

    return { data, meta: { total, page, last_page: Math.ceil(total / limit) } };
  }
}
