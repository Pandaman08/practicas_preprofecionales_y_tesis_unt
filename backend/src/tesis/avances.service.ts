import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvancesService {
  constructor(private prisma: PrismaService) {}

  async findByTesis(tesisId: number) {
    const tesis = await this.prisma.tesis.findUnique({ where: { id: tesisId } });
    if (!tesis) throw new NotFoundException(`Tesis #${tesisId} no encontrada`);
    return this.prisma.avanceTesis.findMany({
      where: { tesisId },
      orderBy: { fecha: 'asc' },
    });
  }

  async create(tesisId: number, dto: any) {
    const tesis = await this.prisma.tesis.findUnique({ where: { id: tesisId } });
    if (!tesis) throw new NotFoundException(`Tesis #${tesisId} no encontrada`);

    const avance = await this.prisma.avanceTesis.create({
      data: { tesisId, ...dto },
    });

    // Calcular porcentaje promedio
    const avances = await this.prisma.avanceTesis.findMany({ where: { tesisId } });
    const promedio = avances.reduce((sum, a) => sum + a.porcentaje, 0) / avances.length;

    // Auto-actualizar estado según avance
    if (promedio >= 100) {
      await this.prisma.tesis.update({
        where: { id: tesisId },
        data: { estado: 'LISTA_SUSTENTACION' },
      });
    }

    return avance;
  }

  async update(id: number, dto: any) {
    const avance = await this.prisma.avanceTesis.findUnique({ where: { id } });
    if (!avance) throw new NotFoundException(`Avance #${id} no encontrado`);
    return this.prisma.avanceTesis.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const avance = await this.prisma.avanceTesis.findUnique({ where: { id } });
    if (!avance) throw new NotFoundException(`Avance #${id} no encontrado`);
    return this.prisma.avanceTesis.delete({ where: { id } });
  }
}
