import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearPaqueteDto } from '@lis/contracts';

@Injectable()
export class PaquetesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CrearPaqueteDto) {
    return this.prisma.paquete.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio_total: data.precio_total,
        detalles: {
          create: data.pruebas_ids.map(id => ({ id_prueba: id }))
        }
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? { nombre: { contains: search, mode: 'insensitive' as any } } : {};

    const [data, total] = await Promise.all([
      this.prisma.paquete.findMany({
        where, skip, take: limit, orderBy: { nombre: 'asc' },
        include: {
          detalles: {
            include: { prueba: true }
          }
        }
      }),
      this.prisma.paquete.count({ where }),
    ]);

    return { data, meta: { total, page, last_page: Math.ceil(total / limit) } };
  }

  async delete(id: string) {
    // Soft delete o inactiva en la vida real, aquí borramos por MVP
    return this.prisma.paquete.delete({ where: { id } });
  }
}
