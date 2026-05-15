import { PrismaClient, Rol, TipoMuestra } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Sede y Admin
  const sede = await prisma.sede.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' }, // Solo para evitar errores si ya existe, usaremos nombre
    update: {},
    create: {
      nombre: 'Sede Central',
      direccion: 'Av. Principal 123',
      es_principal: true,
    },
  });

  const hashedPwd = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      nombre: 'Administrador Principal',
      login: 'admin',
      hash_password: hashedPwd,
      rol: Rol.ADMINISTRADOR,
      id_sede: sede.id,
    },
  });

  // 2. Pruebas Base para los perfiles
  const examenes = [
    { codigo: 'GLU', descripcion: 'Glucosa', tipo_muestra: TipoMuestra.SUERO, area: 'Bioquímica', tiempo_entrega_hrs: 2 },
    { codigo: 'COL', descripcion: 'Colesterol', tipo_muestra: TipoMuestra.SUERO, area: 'Bioquímica', tiempo_entrega_hrs: 2 },
    { codigo: 'TRI', descripcion: 'Triglicéridos', tipo_muestra: TipoMuestra.SUERO, area: 'Bioquímica', tiempo_entrega_hrs: 2 },
    { codigo: 'PH', descripcion: 'Perfil hepático', tipo_muestra: TipoMuestra.SUERO, area: 'Bioquímica', tiempo_entrega_hrs: 4 },
    { codigo: 'HEM', descripcion: 'Hemograma', tipo_muestra: TipoMuestra.SANGRE_TOTAL, area: 'Hematología', tiempo_entrega_hrs: 2 },
    { codigo: 'URE', descripcion: 'Urea', tipo_muestra: TipoMuestra.SUERO, area: 'Bioquímica', tiempo_entrega_hrs: 2 },
    { codigo: 'CRE', descripcion: 'Creatinina', tipo_muestra: TipoMuestra.SUERO, area: 'Bioquímica', tiempo_entrega_hrs: 2 },
    { codigo: 'GLU_B', descripcion: 'Glucosa basal', tipo_muestra: TipoMuestra.SUERO, area: 'Bioquímica', tiempo_entrega_hrs: 2 },
    { codigo: 'INS_B', descripcion: 'Insulina basal', tipo_muestra: TipoMuestra.SUERO, area: 'Inmunología', tiempo_entrega_hrs: 4 },
    { codigo: 'HBA1C', descripcion: 'Hemoglobina glicosilada (HbA1c)', tipo_muestra: TipoMuestra.SANGRE_TOTAL, area: 'Bioquímica', tiempo_entrega_hrs: 4 },
    { codigo: 'EX_ORI', descripcion: 'Examen de orina', tipo_muestra: TipoMuestra.ORINA, area: 'Urianálisis', tiempo_entrega_hrs: 2 },
    { codigo: 'TOL_GLU', descripcion: 'Tolerancia glucosa/insulina', tipo_muestra: TipoMuestra.SUERO, area: 'Bioquímica', tiempo_entrega_hrs: 6 },
    { codigo: 'T3', descripcion: 'T3', tipo_muestra: TipoMuestra.SUERO, area: 'Inmunología', tiempo_entrega_hrs: 4 },
    { codigo: 'T4', descripcion: 'T4', tipo_muestra: TipoMuestra.SUERO, area: 'Inmunología', tiempo_entrega_hrs: 4 },
    { codigo: 'TSH', descripcion: 'TSH', tipo_muestra: TipoMuestra.SUERO, area: 'Inmunología', tiempo_entrega_hrs: 4 },
  ];

  const pruebasDb: Record<string, string> = {};
  
  for (const ex of examenes) {
    const p = await prisma.prueba.upsert({
      where: { codigo: ex.codigo },
      update: {},
      create: ex,
    });
    pruebasDb[p.codigo] = p.id;
  }

  // 3. Crear Paquetes (Perfiles)
  const perfiles = [
    {
      nombre: 'Perfil 100',
      descripcion: 'Requisito: En ayunas.',
      precio: 100.00,
      pruebas: ['GLU', 'COL', 'TRI', 'PH', 'HEM', 'URE', 'CRE'],
    },
    {
      nombre: 'Perfil Diabético',
      descripcion: 'Requisito: Ninguno.',
      precio: 160.00,
      pruebas: ['GLU_B', 'COL', 'TRI', 'INS_B', 'HBA1C', 'URE', 'CRE', 'EX_ORI'],
    },
    {
      nombre: 'Perfil Prediabético',
      descripcion: 'Requisito: Ninguno.',
      precio: 220.00,
      pruebas: ['GLU_B', 'TOL_GLU', 'HBA1C', 'COL', 'TRI', 'EX_ORI'],
    },
    {
      nombre: 'Perfil Tiroideo',
      descripcion: 'Requisito: No necesita ayuno.',
      precio: 80.00,
      pruebas: ['T3', 'T4', 'TSH'],
    },
    {
      nombre: 'Oferta Especial Preventiva',
      descripcion: '“Prevenir es mejor que curar”',
      precio: 20.00,
      pruebas: ['GLU', 'COL', 'TRI'],
    },
  ];

  for (const perf of perfiles) {
    // Buscar si existe para no duplicar en re-ejecuciones
    let paquete = await prisma.paquete.findFirst({ where: { nombre: perf.nombre } });
    if (!paquete) {
      paquete = await prisma.paquete.create({
        data: {
          nombre: perf.nombre,
          descripcion: perf.descripcion,
          precio_total: perf.precio,
          detalles: {
            create: perf.pruebas.map(cod => ({
              id_prueba: pruebasDb[cod]
            }))
          }
        }
      });
      console.log(`Creado paquete: ${perf.nombre}`);
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
