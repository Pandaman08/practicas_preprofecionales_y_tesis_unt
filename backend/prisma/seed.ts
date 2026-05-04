import {
  PrismaClient,
  Rol,
  EstadoConvenio,
  EstadoPostulacion,
  EstadoPractica,
  EstadoTesis,
  TipoTesis,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const firstNames = [
  'Carlos', 'Luis', 'Maria', 'Rosa', 'Ana', 'Jose', 'Miguel', 'Jorge',
  'Daniela', 'Andrea', 'Lucia', 'Paola', 'Fernando', 'Ricardo', 'Sofia', 'Elena',
  'Pedro', 'Milagros', 'Bruno', 'Vanessa',
];

const lastNames = [
  'Garcia', 'Lopez', 'Perez', 'Vargas', 'Cruz', 'Torres', 'Castillo', 'Ramirez',
  'Sanchez', 'Flores', 'Rojas', 'Delgado', 'Mendoza', 'Vasquez', 'Quispe', 'Reyes',
];

const specialties = [
  'Ingenieria de Software',
  'Ingenieria de Sistemas',
  'Ciencia de Datos',
  'Seguridad Informatica',
  'Arquitectura de Software',
  'Inteligencia Artificial',
  'Redes y Comunicaciones',
];

const sectors = [
  'Tecnologia',
  'Finanzas',
  'Educacion',
  'Logistica',
  'Salud',
  'Retail',
  'Consultoria',
];

const thesisAreas = [
  'Sistemas de Informacion',
  'Analitica de Datos',
  'Transformacion Digital',
  'Computacion en la Nube',
  'Gobierno de TI',
  'Ciberseguridad',
  'Automatizacion de Procesos',
];

const offerTitles = [
  'Practicante de Desarrollo Frontend',
  'Practicante de Desarrollo Backend',
  'Practicante de QA y Testing',
  'Practicante de Analisis de Datos',
  'Practicante de Soporte TI',
  'Practicante de DevOps',
  'Practicante de Seguridad Informatica',
];

const practiceActivities = [
  'Implementacion de modulo funcional',
  'Pruebas unitarias y de integracion',
  'Levantamiento de requerimientos con usuarios',
  'Soporte y mantenimiento correctivo',
  'Documentacion tecnica del sistema',
  'Automatizacion de reportes operativos',
  'Analisis de incidencias en produccion',
];

const thesisProgress = [
  'Revision de literatura',
  'Definicion del problema y objetivos',
  'Diseno metodologico',
  'Implementacion del prototipo',
  'Validacion experimental',
  'Ajustes finales y conclusiones',
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function buildUniquePerson(index: number) {
  const first = firstNames[index % firstNames.length];
  const second = firstNames[Math.floor(index / firstNames.length) % firstNames.length];
  const last1 = lastNames[index % lastNames.length];
  const last2 = lastNames[Math.floor(index / lastNames.length) % lastNames.length];

  const nombres = first === second ? first : `${first} ${second}`;
  const apellidos = last1 === last2 ? `${last1} ${last2}` : `${last1} ${last2}`;
  return { nombres, apellidos };
}

function pickManyUnique<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function dateFromNow(daysDelta: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysDelta);
  return d;
}

function weightedPostulationStatus(isOfferActive: boolean): EstadoPostulacion {
  const roll = Math.random();
  if (!isOfferActive) return roll < 0.8 ? EstadoPostulacion.RECHAZADA : EstadoPostulacion.PENDIENTE;
  if (roll < 0.45) return EstadoPostulacion.PENDIENTE;
  if (roll < 0.7) return EstadoPostulacion.ACEPTADA;
  return EstadoPostulacion.RECHAZADA;
}

function weightedPracticeStatus(): EstadoPractica {
  const roll = Math.random();
  if (roll < 0.45) return EstadoPractica.EN_CURSO;
  if (roll < 0.85) return EstadoPractica.COMPLETADA;
  if (roll < 0.95) return EstadoPractica.PENDIENTE;
  return EstadoPractica.CANCELADA;
}

function weightedThesisStatus(): EstadoTesis {
  const roll = Math.random();
  if (roll < 0.15) return EstadoTesis.PROPUESTA;
  if (roll < 0.28) return EstadoTesis.APROBADA;
  if (roll < 0.62) return EstadoTesis.EN_DESARROLLO;
  if (roll < 0.77) return EstadoTesis.OBSERVADA;
  if (roll < 0.9) return EstadoTesis.LISTA_SUSTENTACION;
  return EstadoTesis.SUSTENTADA;
}

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...');

  await prisma.avanceTesis.deleteMany();
  await prisma.tesis.deleteMany();
  await prisma.seguimiento.deleteMany();
  await prisma.practica.deleteMany();
  await prisma.postulacion.deleteMany();
  await prisma.oferta.deleteMany();
  await prisma.convenio.deleteMany();
  await prisma.estudiante.deleteMany();
  await prisma.asesor.deleteMany();
  await prisma.empresa.deleteMany();
  await prisma.usuario.deleteMany();

  const passwords = {
    admin: await bcrypt.hash('admin123', 10),
    coordinador: await bcrypt.hash('coord123', 10),
    asesor: await bcrypt.hash('asesor123', 10),
    estudiante: await bcrypt.hash('estud123', 10),
    empresa: await bcrypt.hash('empresa123', 10),
  };

  await prisma.usuario.createMany({
    data: [
      { email: 'admin@unt.edu.pe', password: passwords.admin, rol: Rol.ADMIN },
      { email: 'coordinador@unt.edu.pe', password: passwords.coordinador, rol: Rol.COORDINADOR },
    ],
  });

  const asesores = [] as Awaited<ReturnType<typeof prisma.asesor.create>>[];
  for (let i = 1; i <= 12; i++) {
    const person = buildUniquePerson(i + 1000);
    const user = await prisma.usuario.create({
      data: {
        email: i === 1 ? 'asesor1@unt.edu.pe' : `asesor${i}.${person.nombres.replace(/\s+/g, '').toLowerCase()}@unt.edu.pe`,
        password: passwords.asesor,
        rol: Rol.ASESOR,
      },
    });
    const asesor = await prisma.asesor.create({
      data: {
        usuarioId: user.id,
        nombres: person.nombres,
        apellidos: person.apellidos,
        dni: `70${String(i).padStart(6, '0')}`,
        telefono: `044-${randomInt(100000, 999999)}`,
        especialidad: pickOne(specialties),
        grado: i % 3 === 0 ? 'Doctor' : 'Magister',
      },
    });
    asesores.push(asesor);
  }

  const empresas = [] as Awaited<ReturnType<typeof prisma.empresa.create>>[];
  for (let i = 1; i <= 15; i++) {
    const sector = sectors[(i - 1) % sectors.length];
    const person = buildUniquePerson(i + 2000);
    const user = await prisma.usuario.create({
      data: {
        email: `empresa${i}@demo.pe`,
        password: passwords.empresa,
        rol: Rol.EMPRESA,
      },
    });
    const empresa = await prisma.empresa.create({
      data: {
        usuarioId: user.id,
        razonSocial: `Empresa Demo ${i} SAC`,
        ruc: `20${String(100000000 + i).slice(0, 9)}`,
        direccion: `Av. Principal ${100 + i}, Trujillo`,
        telefono: `044-${randomInt(100000, 999999)}`,
        sector,
        contactoNombre: `${person.nombres} ${person.apellidos.split(' ')[0]}`,
        contactoEmail: `contacto${i}@empresa-demo.pe`,
      },
    });
    empresas.push(empresa);
  }

  const estudiantes = [] as Awaited<ReturnType<typeof prisma.estudiante.create>>[];
  for (let i = 1; i <= 80; i++) {
    const person = buildUniquePerson(i);
    const user = await prisma.usuario.create({
      data: {
        email: i === 1 ? 'estudiante1@unt.edu.pe' : `estudiante${i}.${person.nombres.split(' ')[0].toLowerCase()}@unt.edu.pe`,
        password: passwords.estudiante,
        rol: Rol.ESTUDIANTE,
      },
    });
    const estudiante = await prisma.estudiante.create({
      data: {
        usuarioId: user.id,
        codigo: `10${String(10000000 + i).slice(0, 8)}`,
        nombres: person.nombres,
        apellidos: person.apellidos,
        dni: `40${String(i).padStart(6, '0')}`,
        telefono: Math.random() < 0.85 ? `9${randomInt(10000000, 99999999)}` : null,
        direccion: Math.random() < 0.6 ? `Mz. ${randomInt(1, 30)} Lt. ${randomInt(1, 20)}, Trujillo` : null,
        ciclo: randomInt(6, 10),
        especialidad: pickOne(specialties),
      },
    });
    estudiantes.push(estudiante);
  }

  const convenios = [] as Awaited<ReturnType<typeof prisma.convenio.create>>[];
  let convenioSeq = 1;
  for (const empresa of empresas) {
    const conveniosPorEmpresa = randomInt(1, 2);
    for (let i = 0; i < conveniosPorEmpresa; i++) {
      const fechaInicio = dateFromNow(randomInt(-600, -120));
      const fechaFin = dateFromNow(randomInt(-80, 420));
      let estado: EstadoConvenio = EstadoConvenio.ACTIVO;
      if (fechaFin < new Date()) {
        estado = EstadoConvenio.VENCIDO;
      } else if (Math.random() < 0.2) {
        estado = EstadoConvenio.EN_RENOVACION;
      }

      const convenio = await prisma.convenio.create({
        data: {
          empresaId: empresa.id,
          numero: `CONV-${new Date().getFullYear()}-${String(convenioSeq).padStart(4, '0')}`,
          fechaInicio,
          fechaFin,
          estado,
          observaciones: estado === EstadoConvenio.EN_RENOVACION ? 'En proceso de renovacion' : null,
        },
      });
      convenios.push(convenio);
      convenioSeq++;
    }
  }

  const ofertas = [] as Awaited<ReturnType<typeof prisma.oferta.create>>[];
  for (const empresa of empresas) {
    const ofertasPorEmpresa = randomInt(2, 5);
    for (let i = 0; i < ofertasPorEmpresa; i++) {
      const fechaLimite = dateFromNow(randomInt(-90, 120));
      const activo = fechaLimite >= new Date() && Math.random() > 0.15;
      const modalidad = pickOne(['presencial', 'hibrido', 'remoto']);

      const oferta = await prisma.oferta.create({
        data: {
          empresaId: empresa.id,
          titulo: `${pickOne(offerTitles)} - ${empresa.razonSocial}`,
          descripcion: 'Convocatoria para estudiantes con enfoque en resultados y aprendizaje continuo.',
          requisitos: 'Conocimientos en programacion, trabajo en equipo y comunicacion efectiva.',
          beneficios: 'Linea de carrera, acompanamiento de mentor y capacitaciones internas.',
          horario: pickOne(['Lunes a Viernes 8:00 - 13:00', 'Lunes a Viernes 14:00 - 19:00', 'Horario flexible por objetivos']),
          modalidad,
          vacantes: randomInt(1, 5),
          fechaLimite,
          activo,
        },
      });
      ofertas.push(oferta);
    }
  }

  const acceptedPostulations: Array<{
    estudianteId: number;
    ofertaId: number;
    empresaId: number;
  }> = [];

  for (const estudiante of estudiantes) {
    const targetOffers = pickManyUnique(ofertas, randomInt(3, 6));
    for (const oferta of targetOffers) {
      const estado = weightedPostulationStatus(oferta.activo);
      await prisma.postulacion.create({
        data: {
          estudianteId: estudiante.id,
          ofertaId: oferta.id,
          estado,
          cartaMotivacion: Math.random() < 0.8 ? 'Me interesa contribuir y aprender en esta posicion.' : null,
          fechaPostulacion: dateFromNow(randomInt(-120, -1)),
        },
      });

      if (estado === EstadoPostulacion.ACEPTADA) {
        acceptedPostulations.push({
          estudianteId: estudiante.id,
          ofertaId: oferta.id,
          empresaId: oferta.empresaId,
        });
      }
    }
  }

  const practicasByStudent = new Map<number, number>();
  const practicas = [] as Awaited<ReturnType<typeof prisma.practica.create>>[];
  for (const accepted of acceptedPostulations) {
    const currentCount = practicasByStudent.get(accepted.estudianteId) ?? 0;
    if (currentCount >= 2 || Math.random() > 0.72) continue;

    const estado = weightedPracticeStatus();
    const startDate = dateFromNow(randomInt(-220, -20));
    // EN_CURSO/PENDIENTE: siempre tienen fechaFin planificada (mezcla de próximas y futuras)
    const endDate = estado === EstadoPractica.EN_CURSO || estado === EstadoPractica.PENDIENTE
      ? dateFromNow(randomInt(1, 60))
      : dateFromNow(randomInt(-10, 140));

    const practica = await prisma.practica.create({
      data: {
        estudianteId: accepted.estudianteId,
        asesorId: pickOne(asesores).id,
        empresaId: accepted.empresaId,
        ofertaId: accepted.ofertaId,
        titulo: `Practica preprofesional ${randomInt(1000, 9999)}`,
        descripcion: 'Participacion en proyectos del area con seguimiento semanal.',
        fechaInicio: startDate,
        fechaFin: endDate,
        horasTotales: estado === EstadoPractica.COMPLETADA ? randomInt(240, 420) : randomInt(60, 220),
        estado,
        observaciones: estado === EstadoPractica.CANCELADA ? 'Interrupcion por motivos academicos' : null,
      },
    });
    practicas.push(practica);
    practicasByStudent.set(accepted.estudianteId, currentCount + 1);

    const trackings = randomInt(2, 7);
    for (let i = 0; i < trackings; i++) {
      await prisma.seguimiento.create({
        data: {
          practicaId: practica.id,
          fecha: dateFromNow(randomInt(-90, 0)),
          actividades: pickOne(practiceActivities),
          horasEjecutadas: randomInt(4, 24),
          observaciones: Math.random() < 0.35 ? 'Sin observaciones relevantes.' : null,
        },
      });
    }
  }

  const tesis = [] as Awaited<ReturnType<typeof prisma.tesis.create>>[];
  for (const estudiante of estudiantes) {
    if (Math.random() > 0.74) continue;

    const estado = weightedThesisStatus();
    const fechaInicio = dateFromNow(randomInt(-360, -20));
    const fechaSustentacion =
      estado === EstadoTesis.SUSTENTADA || estado === EstadoTesis.LISTA_SUSTENTACION
        ? dateFromNow(randomInt(5, 90))
        : null;

    const tesisItem = await prisma.tesis.create({
      data: {
        estudianteId: estudiante.id,
        asesorId: pickOne(asesores).id,
        titulo: `Propuesta ${pickOne(thesisAreas)} ${randomInt(100, 999)}`,
        tipo: Math.random() < 0.7 ? TipoTesis.TESIS : pickOne([TipoTesis.PROYECTO_INVESTIGACION, TipoTesis.TRABAJO_SUFICIENCIA]),
        area: pickOne(thesisAreas),
        resumen: 'Trabajo orientado a resolver una problematica real con enfoque aplicado.',
        estado,
        fechaInicio,
        fechaSustentacion,
        notaFinal: estado === EstadoTesis.SUSTENTADA ? randomInt(13, 19) : null,
      },
    });
    tesis.push(tesisItem);

    const totalAvances =
      estado === EstadoTesis.PROPUESTA
        ? 1
        : estado === EstadoTesis.APROBADA
          ? 2
          : estado === EstadoTesis.EN_DESARROLLO
            ? randomInt(3, 5)
            : randomInt(4, 7);

    for (let i = 1; i <= totalAvances; i++) {
      const porcentajeBase = Math.floor((i / totalAvances) * 100);
      await prisma.avanceTesis.create({
        data: {
          tesisId: tesisItem.id,
          capitulo: `Capitulo ${i}`,
          descripcion: pickOne(thesisProgress),
          porcentaje: Math.min(100, porcentajeBase + randomInt(-5, 8)),
          observaciones: Math.random() < 0.3 ? 'Requiere ajustes menores segun retroalimentacion.' : null,
          fecha: dateFromNow(randomInt(-180, 0)),
        },
      });
    }
  }

  const totalUsuarios = await prisma.usuario.count();
  const totalAsesores = await prisma.asesor.count();
  const totalEmpresas = await prisma.empresa.count();
  const totalEstudiantes = await prisma.estudiante.count();
  const totalConvenios = await prisma.convenio.count();
  const totalOfertas = await prisma.oferta.count();
  const totalPostulaciones = await prisma.postulacion.count();
  const totalPracticas = await prisma.practica.count();
  const totalTesis = await prisma.tesis.count();
  const totalAvances = await prisma.avanceTesis.count();

  console.log('\n✅ Seed completado exitosamente');
  console.log('----------------------------------------------');
  console.log(`Usuarios:       ${totalUsuarios}`);
  console.log(`Asesores:       ${totalAsesores}`);
  console.log(`Empresas:       ${totalEmpresas}`);
  console.log(`Estudiantes:    ${totalEstudiantes}`);
  console.log(`Convenios:      ${totalConvenios}`);
  console.log(`Ofertas:        ${totalOfertas}`);
  console.log(`Postulaciones:  ${totalPostulaciones}`);
  console.log(`Practicas:      ${totalPracticas}`);
  console.log(`Tesis:          ${totalTesis}`);
  console.log(`Avances tesis:  ${totalAvances}`);
  console.log('----------------------------------------------');
  console.log('\nCredenciales principales:');
  console.log('  Admin:        admin@unt.edu.pe / admin123');
  console.log('  Coordinador:  coordinador@unt.edu.pe / coord123');
  console.log('  Asesor:       asesor1@unt.edu.pe / asesor123');
  console.log('  Estudiante:   estudiante1@unt.edu.pe / estud123');
  console.log('  Empresa:      empresa1@demo.pe / empresa123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
