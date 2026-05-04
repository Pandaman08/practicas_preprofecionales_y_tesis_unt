/*
  Warnings:

  - A unique constraint covering the columns `[postulacionId]` on the table `practicas` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "postulaciones" ADD COLUMN     "archivoCv" TEXT;

-- AlterTable
ALTER TABLE "practicas" ADD COLUMN     "postulacionId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "practicas_postulacionId_key" ON "practicas"("postulacionId");

-- AddForeignKey
ALTER TABLE "practicas" ADD CONSTRAINT "practicas_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "ofertas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practicas" ADD CONSTRAINT "practicas_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "postulaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
