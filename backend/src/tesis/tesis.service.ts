import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoTesis, Rol } from '@prisma/client';

@Injectable()
export class TesisService {
  constructor(private prisma: PrismaService) {}

  private normalizeDateField(payload: any, field: string, label: string) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') return;
    const parsed = new Date(payload[field]);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Fecha invalida en ${label}`);
    }
    payload[field] = parsed;
  }

  async findAll(params: {
    currentUser?: { id: number; rol: string };
    estudianteId?: number;
    asesorId?: number;
    estado?: EstadoTesis;
    page?: number;
    limit?: number;
  }) {
    const { currentUser, estudianteId, asesorId, estado, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (estudianteId) where.estudianteId = estudianteId;

    // Si el usuario es ASESOR, forzar filtro por su propio asesorId
    if (currentUser?.rol === Rol.ASESOR) {
      const asesor = await this.prisma.asesor.findUnique({
        where: { usuarioId: currentUser.id },
        select: { id: true },
      });
      if (asesor) where.asesorId = asesor.id;
    } else if (asesorId) {
      where.asesorId = asesorId;
    }

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
    const payload = { ...dto };
    this.normalizeDateField(payload, 'fechaInicio', 'fechaInicio');
    this.normalizeDateField(payload, 'fechaSustentacion', 'fechaSustentacion');

    return this.prisma.tesis.create({
      data: payload,
      include: { estudiante: true, asesor: true },
    });
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    const payload = { ...dto };
    this.normalizeDateField(payload, 'fechaInicio', 'fechaInicio');
    this.normalizeDateField(payload, 'fechaSustentacion', 'fechaSustentacion');

    return this.prisma.tesis.update({
      where: { id },
      data: payload,
      include: { estudiante: true, asesor: true },
    });
  }
}
