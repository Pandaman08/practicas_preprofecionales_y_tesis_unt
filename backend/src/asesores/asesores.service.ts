import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AsesoresService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { especialidad?: string; page?: number; limit?: number }) {
    const { especialidad, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (especialidad) where.especialidad = { contains: especialidad, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.asesor.findMany({
        where,
        skip,
        take: limit,
        include: { usuario: { select: { email: true, activo: true } } },
        orderBy: { apellidos: 'asc' },
      }),
      this.prisma.asesor.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const asesor = await this.prisma.asesor.findUnique({
      where: { id },
      include: {
        usuario: { select: { email: true, activo: true } },
        practicas: { include: { estudiante: true } },
        tesis: { include: { estudiante: true } },
      },
    });
    if (!asesor) throw new NotFoundException(`Asesor #${id} no encontrado`);
    return asesor;
  }

  async findByUsuario(usuarioId: number) {
    const asesor = await this.prisma.asesor.findUnique({
      where: { usuarioId },
      include: {
        practicas: { include: { estudiante: true, empresa: true } },
        tesis: { include: { estudiante: true } },
      },
    });
    if (!asesor) throw new NotFoundException('Perfil de asesor no encontrado');
    return asesor;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.asesor.update({ where: { id }, data: dto });
  }

  async updateByUsuario(usuarioId: number, dto: any) {
    return this.prisma.asesor.update({ where: { usuarioId }, data: dto });
  }
}
