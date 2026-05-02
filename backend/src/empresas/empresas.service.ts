import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { sector?: string; page?: number; limit?: number }) {
    const { sector, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (sector) where.sector = { contains: sector, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.empresa.findMany({
        where,
        skip,
        take: limit,
        include: {
          usuario: { select: { email: true, activo: true } },
          _count: { select: { ofertas: true, convenios: true } },
        },
        orderBy: { razonSocial: 'asc' },
      }),
      this.prisma.empresa.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const emp = await this.prisma.empresa.findUnique({
      where: { id },
      include: {
        usuario: { select: { email: true, activo: true } },
        ofertas: true,
        convenios: true,
        practicas: { include: { estudiante: true } },
      },
    });
    if (!emp) throw new NotFoundException(`Empresa #${id} no encontrada`);
    return emp;
  }

  async findByUsuario(usuarioId: number) {
    const emp = await this.prisma.empresa.findUnique({
      where: { usuarioId },
      include: { ofertas: true, convenios: true },
    });
    if (!emp) throw new NotFoundException('Perfil de empresa no encontrado');
    return emp;
  }

  async create(dto: any) {
    return this.prisma.empresa.create({ data: dto });
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.empresa.update({ where: { id }, data: dto });
  }

  async updateByUsuario(usuarioId: number, dto: any) {
    return this.prisma.empresa.update({ where: { usuarioId }, data: dto });
  }
}
