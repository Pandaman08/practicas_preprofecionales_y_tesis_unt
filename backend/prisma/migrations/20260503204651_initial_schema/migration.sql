-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'ESTUDIANTE', 'ASESOR', 'EMPRESA', 'COORDINADOR');

-- CreateEnum
CREATE TYPE "EstadoPractica" AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoTesis" AS ENUM ('PROPUESTA', 'APROBADA', 'EN_DESARROLLO', 'LISTA_SUSTENTACION', 'SUSTENTADA', 'OBSERVADA');

-- CreateEnum
CREATE TYPE "EstadoPostulacion" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "EstadoConvenio" AS ENUM ('ACTIVO', 'VENCIDO', 'EN_RENOVACION');

-- CreateEnum
CREATE TYPE "TipoTesis" AS ENUM ('TESIS', 'TRABAJO_SUFICIENCIA', 'PROYECTO_INVESTIGACION');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ESTUDIANTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "ciclo" INTEGER NOT NULL,
    "especialidad" TEXT NOT NULL,
    "cv" TEXT,
    "foto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asesores" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "telefono" TEXT,
    "especialidad" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "foto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asesores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "sector" TEXT,
    "contactoNombre" TEXT,
    "contactoEmail" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convenios" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoConvenio" NOT NULL DEFAULT 'ACTIVO',
    "documento" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convenios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ofertas" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "requisitos" TEXT,
    "beneficios" TEXT,
    "horario" TEXT,
    "modalidad" TEXT NOT NULL DEFAULT 'presencial',
    "vacantes" INTEGER NOT NULL DEFAULT 1,
    "fechaLimite" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ofertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postulaciones" (
    "id" SERIAL NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "ofertaId" INTEGER NOT NULL,
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'PENDIENTE',
    "cartaMotivacion" TEXT,
    "fechaPostulacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postulaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practicas" (
    "id" SERIAL NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "asesorId" INTEGER,
    "empresaId" INTEGER NOT NULL,
    "ofertaId" INTEGER,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "horasTotales" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoPractica" NOT NULL DEFAULT 'PENDIENTE',
    "cartaAceptacion" TEXT,
    "informeFinal" TEXT,
    "notaFinal" DOUBLE PRECISION,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientos" (
    "id" SERIAL NOT NULL,
    "practicaId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actividades" TEXT NOT NULL,
    "horasEjecutadas" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "archivoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tesis" (
    "id" SERIAL NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "asesorId" INTEGER,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoTesis" NOT NULL DEFAULT 'TESIS',
    "area" TEXT,
    "resumen" TEXT,
    "estado" "EstadoTesis" NOT NULL DEFAULT 'PROPUESTA',
    "fechaInicio" TIMESTAMP(3),
    "fechaSustentacion" TIMESTAMP(3),
    "notaFinal" DOUBLE PRECISION,
    "documentoFinal" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avances_tesis" (
    "id" SERIAL NOT NULL,
    "tesisId" INTEGER NOT NULL,
    "capitulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "porcentaje" INTEGER NOT NULL DEFAULT 0,
    "archivoUrl" TEXT,
    "observaciones" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avances_tesis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_usuarioId_key" ON "estudiantes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_codigo_key" ON "estudiantes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_dni_key" ON "estudiantes"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "asesores_usuarioId_key" ON "asesores"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "asesores_dni_key" ON "asesores"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_usuarioId_key" ON "empresas"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_ruc_key" ON "empresas"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "convenios_numero_key" ON "convenios"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "postulaciones_estudianteId_ofertaId_key" ON "postulaciones"("estudianteId", "ofertaId");

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesores" ADD CONSTRAINT "asesores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convenios" ADD CONSTRAINT "convenios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "ofertas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practicas" ADD CONSTRAINT "practicas_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practicas" ADD CONSTRAINT "practicas_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "asesores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practicas" ADD CONSTRAINT "practicas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_practicaId_fkey" FOREIGN KEY ("practicaId") REFERENCES "practicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tesis" ADD CONSTRAINT "tesis_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tesis" ADD CONSTRAINT "tesis_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "asesores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avances_tesis" ADD CONSTRAINT "avances_tesis_tesisId_fkey" FOREIGN KEY ("tesisId") REFERENCES "tesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
