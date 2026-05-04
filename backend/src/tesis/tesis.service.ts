import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoTesis, Rol } from '@prisma/client';

@Injectable()
export class TesisService {
  constructor(private prisma: PrismaService) {}

  private emptyPaginatedResult(page: number, limit: number) {
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  private async applyTesisRoleScope(
    where: any,
    currentUser?: { id: number; rol: string },
  ): Promise<boolean> {
    if (!currentUser) return true;

    const rol = currentUser.rol as Rol;

    if (rol === Rol.ADMIN || rol === Rol.COORDINADOR) {
      return true;
    }

    if (rol === Rol.ESTUDIANTE) {
      const estudiante = await this.prisma.estudiante.findUnique({
        where: { usuarioId: currentUser.id },
        select: { id: true },
      });
      if (!estudiante) return false;
      where.estudianteId = estudiante.id;
      return true;
    }

    if (rol === Rol.ASESOR) {
      const asesor = await this.prisma.asesor.findUnique({
        where: { usuarioId: currentUser.id },
        select: { id: true },
      });
      if (!asesor) return false;
      where.asesorId = asesor.id;
      return true;
    }

    return false;
  }

  private async canAccessTesis(tesis: { estudianteId: number; asesorId: number | null }, currentUser?: { id: number; rol: string }) {
    if (!currentUser) return false;

    const rol = currentUser.rol as Rol;
    if (rol === Rol.ADMIN || rol === Rol.COORDINADOR) return true;

    if (rol === Rol.ESTUDIANTE) {
      const estudiante = await this.prisma.estudiante.findUnique({
        where: { usuarioId: currentUser.id },
        select: { id: true },
      });
      return !!estudiante && tesis.estudianteId === estudiante.id;
    }

    if (rol === Rol.ASESOR) {
      const asesor = await this.prisma.asesor.findUnique({
        where: { usuarioId: currentUser.id },
        select: { id: true },
      });
      return !!asesor && tesis.asesorId === asesor.id;
    }

    return false;
  }

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

    const hasScope = await this.applyTesisRoleScope(where, currentUser);
    if (!hasScope) {
      return this.emptyPaginatedResult(page, limit);
    }

    const canUseRoleExternalFilters =
      !currentUser ||
      currentUser.rol === Rol.ADMIN ||
      currentUser.rol === Rol.COORDINADOR;

    if (canUseRoleExternalFilters) {
      if (estudianteId) where.estudianteId = estudianteId;
      if (asesorId) where.asesorId = asesorId;
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

  async findOne(id: number, currentUser?: { id: number; rol: string }) {
    const tesis = await this.prisma.tesis.findUnique({
      where: { id },
      include: {
        estudiante: true,
        asesor: true,
        avances: { orderBy: { fecha: 'asc' } },
      },
    });
    if (!tesis) throw new NotFoundException(`Tesis #${id} no encontrada`);

    if (currentUser) {
      const canAccess = await this.canAccessTesis(
        { estudianteId: tesis.estudianteId, asesorId: tesis.asesorId },
        currentUser,
      );
      if (!canAccess) {
        throw new ForbiddenException('No tiene permisos para acceder a esta tesis');
      }
    }

    return tesis;
  }

  async create(dto: any, currentUser?: { id: number; rol: string }) {
    const payload = { ...dto };

    if (currentUser?.rol === Rol.ESTUDIANTE) {
      const estudiante = await this.prisma.estudiante.findUnique({
        where: { usuarioId: currentUser.id },
        select: { id: true },
      });
      if (!estudiante) {
        throw new ForbiddenException('No tiene perfil de estudiante asociado para registrar tesis');
      }
      payload.estudianteId = estudiante.id;
    }

    this.normalizeDateField(payload, 'fechaInicio', 'fechaInicio');
    this.normalizeDateField(payload, 'fechaSustentacion', 'fechaSustentacion');

    return this.prisma.tesis.create({
      data: payload,
      include: { estudiante: true, asesor: true },
    });
  }

  async update(id: number, dto: any, currentUser?: { id: number; rol: string }) {
    await this.findOne(id, currentUser);
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
