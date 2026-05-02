import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OfertasService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { empresaId?: number; activo?: boolean; modalidad?: string; page?: number; limit?: number }) {
    const { empresaId, activo, modalidad, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (empresaId) where.empresaId = empresaId;
    if (activo !== undefined) where.activo = activo;
    if (modalidad) where.modalidad = modalidad;

    const [data, total] = await Promise.all([
      this.prisma.oferta.findMany({
        where,
        skip,
        take: limit,
        include: {
          empresa: { select: { razonSocial: true, ruc: true, sector: true, logo: true } },
          _count: { select: { postulaciones: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.oferta.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const oferta = await this.prisma.oferta.findUnique({
      where: { id },
      include: {
        empresa: true,
        postulaciones: { include: { estudiante: true } },
      },
    });
    if (!oferta) throw new NotFoundException(`Oferta #${id} no encontrada`);
    return oferta;
  }

  async create(dto: any) {
    return this.prisma.oferta.create({
      data: dto,
      include: { empresa: { select: { razonSocial: true } } },
    });
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.oferta.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.oferta.update({ where: { id }, data: { activo: false } });
  }
}
