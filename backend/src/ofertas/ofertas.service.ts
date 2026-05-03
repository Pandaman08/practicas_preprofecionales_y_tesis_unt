import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '@prisma/client';

@Injectable()
export class OfertasService {
  constructor(private prisma: PrismaService) {}

  private normalizeDateField(payload: any, field: string, label: string) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') return;
    const parsed = new Date(payload[field]);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Fecha invalida en ${label}`);
    }
    payload[field] = parsed;
  }

  private async resolveEmpresaIdByUsuario(usuarioId: number) {
    const empresa = await this.prisma.empresa.findUnique({ where: { usuarioId } });
    if (!empresa) throw new NotFoundException('Perfil de empresa no encontrado');
    return empresa.id;
  }

  private async assertEmpresaOwnsOferta(ofertaId: number, usuarioId: number) {
    const oferta = await this.prisma.oferta.findUnique({
      where: { id: ofertaId },
      select: { id: true, empresa: { select: { usuarioId: true } } },
    });
    if (!oferta) throw new NotFoundException(`Oferta #${ofertaId} no encontrada`);
    if (oferta.empresa.usuarioId !== usuarioId) {
      throw new ForbiddenException('No tiene permisos para modificar esta oferta');
    }
  }

  async findAll(
    params: { empresaId?: number; activo?: boolean; modalidad?: string; page?: number; limit?: number },
    user: { id: number; rol: Rol },
  ) {
    const { empresaId, activo, modalidad, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (empresaId) where.empresaId = empresaId;
    if (modalidad) where.modalidad = modalidad;

    if (user.rol === Rol.EMPRESA) {
      where.empresaId = await this.resolveEmpresaIdByUsuario(user.id);
      if (activo !== undefined) where.activo = activo;
    } else if (activo !== undefined) {
      where.activo = activo;
    }

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

  async create(dto: any, user: { id: number; rol: Rol }) {
    const payload = { ...dto };
    if (user.rol === Rol.EMPRESA) {
      payload.empresaId = await this.resolveEmpresaIdByUsuario(user.id);
    }
    this.normalizeDateField(payload, 'fechaLimite', 'fechaLimite');

    return this.prisma.oferta.create({
      data: payload,
      include: { empresa: { select: { razonSocial: true } } },
    });
  }

  async update(id: number, dto: any, user: { id: number; rol: Rol }) {
    if (user.rol === Rol.EMPRESA) {
      await this.assertEmpresaOwnsOferta(id, user.id);
    } else {
      await this.findOne(id);
    }

    const payload = { ...dto };
    if (user.rol === Rol.EMPRESA) {
      delete payload.empresaId;
    }
    this.normalizeDateField(payload, 'fechaLimite', 'fechaLimite');

    return this.prisma.oferta.update({ where: { id }, data: payload });
  }

  async remove(id: number, user: { id: number; rol: Rol }) {
    if (user.rol === Rol.EMPRESA) {
      await this.assertEmpresaOwnsOferta(id, user.id);
    } else {
      await this.findOne(id);
    }
    return this.prisma.oferta.update({ where: { id }, data: { activo: false } });
  }
}
