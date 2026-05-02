import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoConvenio } from '@prisma/client';

@Injectable()
export class ConveniosService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { empresaId?: number; estado?: EstadoConvenio; page?: number; limit?: number }) {
    const { empresaId, estado, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (empresaId) where.empresaId = empresaId;
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      this.prisma.convenio.findMany({
        where,
        skip,
        take: limit,
        include: { empresa: { select: { razonSocial: true, ruc: true } } },
        orderBy: { fechaInicio: 'desc' },
      }),
      this.prisma.convenio.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const conv = await this.prisma.convenio.findUnique({
      where: { id },
      include: { empresa: true },
    });
    if (!conv) throw new NotFoundException(`Convenio #${id} no encontrado`);
    return conv;
  }

  async create(dto: any) {
    return this.prisma.convenio.create({ data: dto, include: { empresa: true } });
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.convenio.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.convenio.delete({ where: { id } });
  }
}
