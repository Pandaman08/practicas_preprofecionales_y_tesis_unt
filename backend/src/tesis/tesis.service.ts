import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoTesis } from '@prisma/client';

@Injectable()
export class TesisService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    estudianteId?: number;
    asesorId?: number;
    estado?: EstadoTesis;
    page?: number;
    limit?: number;
  }) {
    const { estudianteId, asesorId, estado, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (estudianteId) where.estudianteId = estudianteId;
    if (asesorId) where.asesorId = asesorId;
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      this.prisma.tesis.findMany({
        where,
        skip,
        take: limit,
        include: {
          estudiante: { select: { nombres: true, apellidos: true, codigo: true, especialidad: true } },
          asesor: { select: { nombres: true, apellidos: true } },
          _count: { select: { avances: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tesis.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const tesis = await this.prisma.tesis.findUnique({
      where: { id },
      include: {
        estudiante: true,
        asesor: true,
        avances: { orderBy: { fecha: 'asc' } },
      },
    });
    if (!tesis) throw new NotFoundException(`Tesis #${id} no encontrada`);
    return tesis;
  }

  async create(dto: any) {
    return this.prisma.tesis.create({
      data: dto,
      include: { estudiante: true, asesor: true },
    });
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.tesis.update({
      where: { id },
      data: dto,
      include: { estudiante: true, asesor: true },
    });
  }
}
