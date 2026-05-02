import { PrismaClient, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@unt.edu.pe' },
    update: {},
    create: {
      email: 'admin@unt.edu.pe',
      password: adminPassword,
      rol: Rol.ADMIN,
    },
  });
  console.log('✅ Admin creado:', admin.email);

  // Coordinador
  const coordPassword = await bcrypt.hash('coord123', 10);
  const coord = await prisma.usuario.upsert({
    where: { email: 'coordinador@unt.edu.pe' },
    update: {},
    create: {
      email: 'coordinador@unt.edu.pe',
      password: coordPassword,
      rol: Rol.COORDINADOR,
    },
  });
  console.log('✅ Coordinador creado:', coord.email);

  // Asesor
  const asesorPassword = await bcrypt.hash('asesor123', 10);
  const asesorUser = await prisma.usuario.upsert({
    where: { email: 'asesor@unt.edu.pe' },
    update: {},
    create: {
      email: 'asesor@unt.edu.pe',
      password: asesorPassword,
      rol: Rol.ASESOR,
    },
  });
  await prisma.asesor.upsert({
    where: { usuarioId: asesorUser.id },
    update: {},
    create: {
      usuarioId: asesorUser.id,
      nombres: 'Carlos',
      apellidos: 'García López',
      dni: '12345678',
      telefono: '044-123456',
      especialidad: 'Ingeniería de Software',
      grado: 'Doctor',
    },
  });
  console.log('✅ Asesor creado:', asesorUser.email);

  // Estudiante
  const estudPassword = await bcrypt.hash('estud123', 10);
  const estudUser = await prisma.usuario.upsert({
    where: { email: 'estudiante@unt.edu.pe' },
    update: {},
    create: {
      email: 'estudiante@unt.edu.pe',
      password: estudPassword,
      rol: Rol.ESTUDIANTE,
    },
  });
  await prisma.estudiante.upsert({
    where: { usuarioId: estudUser.id },
    update: {},
    create: {
      usuarioId: estudUser.id,
      codigo: '1000000001',
      nombres: 'Juan',
      apellidos: 'Pérez Torres',
      dni: '87654321',
      telefono: '044-654321',
      ciclo: 8,
      especialidad: 'Ingeniería Informática',
    },
  });
  console.log('✅ Estudiante creado:', estudUser.email);

  // Empresa
  const empPassword = await bcrypt.hash('empresa123', 10);
  const empUser = await prisma.usuario.upsert({
    where: { email: 'empresa@ejemplo.com' },
    update: {},
    create: {
      email: 'empresa@ejemplo.com',
      password: empPassword,
      rol: Rol.EMPRESA,
    },
  });
  const empresa = await prisma.empresa.upsert({
    where: { usuarioId: empUser.id },
    update: {},
    create: {
      usuarioId: empUser.id,
      razonSocial: 'Tech Solutions SAC',
      ruc: '20123456789',
      direccion: 'Av. España 123, Trujillo',
      telefono: '044-987654',
      sector: 'Tecnología',
      contactoNombre: 'María Rodríguez',
      contactoEmail: 'contacto@techsolutions.com',
    },
  });
  console.log('✅ Empresa creada:', empresa.razonSocial);

  // Convenio de prueba
  await prisma.convenio.upsert({
    where: { numero: 'CONV-2024-001' },
    update: {},
    create: {
      empresaId: empresa.id,
      numero: 'CONV-2024-001',
      fechaInicio: new Date('2024-01-01'),
      fechaFin: new Date('2025-12-31'),
      estado: 'ACTIVO',
    },
  });

  // Oferta de prueba
  await prisma.oferta.create({
    data: {
      empresaId: empresa.id,
      titulo: 'Practicante de Desarrollo de Software',
      descripcion: 'Buscamos practicantes con conocimientos en React y Node.js',
      requisitos: 'Conocimientos en JavaScript, React, Node.js. Estudiante de 8vo ciclo en adelante.',
      beneficios: 'Remuneración S/. 800, modalidad híbrida, horario flexible.',
      horario: 'Lunes a Viernes 8am - 1pm',
      modalidad: 'hibrido',
      vacantes: 3,
      fechaLimite: new Date('2025-06-30'),
    },
  });
  console.log('✅ Oferta de prueba creada');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('  Admin:        admin@unt.edu.pe       / admin123');
  console.log('  Coordinador:  coordinador@unt.edu.pe / coord123');
  console.log('  Asesor:       asesor@unt.edu.pe      / asesor123');
  console.log('  Estudiante:   estudiante@unt.edu.pe  / estud123');
  console.log('  Empresa:      empresa@ejemplo.com    / empresa123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
