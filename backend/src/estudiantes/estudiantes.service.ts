import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EstudiantesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { especialidad?: string; ciclo?: number; page?: number; limit?: number }) {
    const { especialidad, ciclo, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (especialidad) where.especialidad = { contains: especialidad, mode: 'insensitive' };
    if (ciclo) where.ciclo = ciclo;

    const [data, total] = await Promise.all([
      this.prisma.estudiante.findMany({
        where,
        skip,
        take: limit,
        include: { usuario: { select: { email: true, activo: true } } },
        orderBy: { apellidos: 'asc' },
      }),
      this.prisma.estudiante.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const est = await this.prisma.estudiante.findUnique({
      where: { id },
      include: {
        usuario: { select: { email: true, activo: true, createdAt: true } },
        practicas: { include: { empresa: true, asesor: true } },
        tesis: { include: { asesor: true } },
        postulaciones: { include: { oferta: { include: { empresa: true } } } },
      },
    });
    if (!est) throw new NotFoundException(`Estudiante #${id} no encontrado`);
    return est;
  }

  async findByUsuario(usuarioId: number) {
    const est = await this.prisma.estudiante.findUnique({
      where: { usuarioId },
      include: { practicas: true, tesis: true },
    });
    if (!est) throw new NotFoundException('Perfil de estudiante no encontrado');
    return est;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.estudiante.update({
      where: { id },
      data: dto,
    });
  }

  async updateByUsuario(usuarioId: number, dto: any) {
    return this.prisma.estudiante.update({
      where: { usuarioId },
      data: dto,
    });
  }
}
