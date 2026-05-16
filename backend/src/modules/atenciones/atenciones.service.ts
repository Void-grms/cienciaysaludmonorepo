import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearAtencionDto, IngresarResultadosDto } from '@lis/contracts';

@Injectable()
export class AtencionesService {
  constructor(private prisma: PrismaService) { }

  async create(data: CrearAtencionDto, idUsuario: string) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('La orden debe tener al menos un examen o paquete.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Extraer todas las pruebas finales (desglosando paquetes si los hay)
      let subtotal = 0;
      const pruebasMap = new Map<string, any>(); // id_prueba -> prueba
      const itemsGuardar: any[] = []; // { id_producto, tipo, precio, nombre }

      for (const item of data.items) {
        if (item.tipo === 'PRUEBA') {
          const p = await tx.prueba.findUnique({ where: { id: item.id_producto } });
          if (!p) throw new NotFoundException(`Prueba ${item.id_producto} no encontrada`);
          pruebasMap.set(p.id, p);
          itemsGuardar.push({ id_prueba: p.id, precio: item.precio });
          subtotal += item.precio;
        } else if (item.tipo === 'PAQUETE') {
          const paq = await tx.paquete.findUnique({
            where: { id: item.id_producto },
            include: { detalles: { include: { prueba: true } } }
          });
          if (!paq) throw new NotFoundException(`Paquete ${item.id_producto} no encontrado`);

          for (const d of paq.detalles) {
            pruebasMap.set(d.id_prueba, d.prueba);
            itemsGuardar.push({ id_prueba: d.id_prueba, precio: 0, id_paquete: paq.id });
          }
          subtotal += item.precio;
        }
      }

      // 2. Generar Código de Atención (Formato básico ORD-YYYYMMDD-UUIDcortado)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const codigoStr = `ORD-${dateStr}-${randomPart}`;

      const total = subtotal - (data.descuento || 0);

      // 3. Crear Cabecera Atención
      const atencion = await tx.atencion.create({
        data: {
          codigo: codigoStr,
          id_paciente: data.id_paciente,
          id_referencia: data.id_referencia || null,
          id_medico_referidor: data.id_medico_referidor || null,
          id_usuario_registro: idUsuario,
          tipo_atencion: 'AMBULATORIO',
          total,
          estado: 'PENDIENTE_MUESTRA',
          detalles: {
            create: itemsGuardar.map(i => ({
              id_prueba: i.id_prueba,
              precio_aplicado: i.precio,
              estado: 'PENDIENTE',
            }))
          }
        }
      });

      // 4. Agrupar por Tipo de Muestra y crear los Tubos
      const muestrasPorTipo = new Set<string>();
      for (const [_, p] of pruebasMap) {
        muestrasPorTipo.add(p.tipo_muestra);
      }

      for (const tipo of muestrasPorTipo) {
        await tx.muestra.create({
          data: {
            id_atencion: atencion.id,
            tipo_muestra: tipo as any,
            codigo_barra: `${codigoStr}-${tipo}`,
            estado: 'PENDIENTE',
          }
        });
      }

      return atencion;
    });
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.atencion.findMany({
        skip, take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          paciente: { select: { nombres: true, apellidos: true, nro_doc: true } },
          referencia: { select: { nombre: true } }
        }
      }),
      this.prisma.atencion.count(),
    ]);

    return { data, meta: { total, page, last_page: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const atencion = await this.prisma.atencion.findUnique({
      where: { id },
      include: {
        paciente: true,
        referencia: true,
        detalles: { include: { prueba: true } },
        muestras: true,
      }
    });
    if (!atencion) throw new NotFoundException('Atención no encontrada');
    return atencion;
  }

  async updateMuestra(idAtencion: string, idMuestra: string, estado: string) {
    // 1. Actualizar la muestra
    const muestra = await this.prisma.muestra.update({
      where: { id: idMuestra },
      data: { estado: estado as any },
    });

    // 2. Verificar si todas las muestras de la atencion estan TOMADAS
    const todasMuestras = await this.prisma.muestra.findMany({
      where: { id_atencion: idAtencion },
    });

    const todasTomadas = todasMuestras.every(m => m.estado === 'TOMADA' || m.estado === 'RECHAZADA');

    if (todasTomadas) {
      await this.prisma.atencion.update({
        where: { id: idAtencion },
        data: { estado: 'EN_PROCESO' }
      });
    }

    return muestra;
  }

  async ingresarResultados(idAtencion: string, data: IngresarResultadosDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar cada detalle
      for (const res of data.resultados) {
        await tx.detalleAtencion.update({
          where: { id: res.id_detalle },
          data: {
            resultado: res.resultado,
            estado: 'VALIDADO',
          }
        });
      }

      // 2. Verificar si todos los detalles estan validados
      const todosDetalles = await tx.detalleAtencion.findMany({
        where: { id_atencion: idAtencion }
      });

      const todosValidados = todosDetalles.every(d => d.estado === 'VALIDADO');

      if (todosValidados) {
        await tx.atencion.update({
          where: { id: idAtencion },
          data: { estado: 'COMPLETADA' }
        });
      }

      return { success: true, message: todosValidados ? 'Atención completada' : 'Resultados guardados' };
    });
  }
}
