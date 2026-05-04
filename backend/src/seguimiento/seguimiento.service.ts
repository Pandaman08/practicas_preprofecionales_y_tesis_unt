import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoPractica, Rol } from '@prisma/client';

@Injectable()
export class SeguimientoService {
  constructor(private prisma: PrismaService) {}

  private emptyPaginatedResult(page: number, limit: number) {
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  private async applyPracticaRoleScope(
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

    if (rol === Rol.EMPRESA) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { usuarioId: currentUser.id },
        select: { id: true },
      });
      if (!empresa) return false;
      where.empresaId = empresa.id;
      return true;
    }

    return false;
  }

  private async canAccessPractica(practica: { estudianteId: number; asesorId: number | null; empresaId: number }, currentUser?: { id: number; rol: string }) {
    if (!currentUser) return false;

    const rol = currentUser.rol as Rol;
    if (rol === Rol.ADMIN || rol === Rol.COORDINADOR) return true;

    if (rol === Rol.ESTUDIANTE) {
      const estudiante = await this.prisma.estudiante.findUnique({
        where: { usuarioId: currentUser.id },
        select: { id: true },
      });
      return !!estudiante && practica.estudianteId === estudiante.id;
    }

    if (rol === Rol.ASESOR) {
      const asesor = await this.prisma.asesor.findUnique({
        where: { usuarioId: currentUser.id },
        select: { id: true },
      });
      return !!asesor && practica.asesorId === asesor.id;
    }

    if (rol === Rol.EMPRESA) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { usuarioId: currentUser.id },
        select: { id: true },
      });
      return !!empresa && practica.empresaId === empresa.id;
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

  // ---- Prácticas ----
  async findAllPracticas(params: {
    currentUser?: { id: number; rol: string };
    estudianteId?: number;
    empresaId?: number;
    asesorId?: number;
    estado?: EstadoPractica;
    page?: number;
    limit?: number;
  }) {
    const { currentUser, estudianteId, empresaId, asesorId, estado, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};

    const hasScope = await this.applyPracticaRoleScope(where, currentUser);
    if (!hasScope) {
      return this.emptyPaginatedResult(page, limit);
    }

    const canUseRoleExternalFilters =
      !currentUser ||
      currentUser.rol === Rol.ADMIN ||
      currentUser.rol === Rol.COORDINADOR;

    if (canUseRoleExternalFilters) {
      if (estudianteId) where.estudianteId = estudianteId;
      if (empresaId) where.empresaId = empresaId;
      if (asesorId) where.asesorId = asesorId;
    }

    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      this.prisma.practica.findMany({
        where,
        skip,
        take: limit,
        include: {
          estudiante: { select: { nombres: true, apellidos: true, codigo: true } },
          asesor: { select: { nombres: true, apellidos: true } },
          empresa: { select: { razonSocial: true } },
          _count: { select: { seguimientos: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.practica.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOnePractica(id: number, currentUser?: { id: number; rol: string }) {
    const p = await this.prisma.practica.findUnique({
      where: { id },
      include: {
        estudiante: true,
        asesor: true,
        empresa: true,
        seguimientos: { orderBy: { fecha: 'asc' } },
      },
    });
    if (!p) throw new NotFoundException(`Práctica #${id} no encontrada`);

    if (currentUser) {
      const canAccess = await this.canAccessPractica(
        { estudianteId: p.estudianteId, asesorId: p.asesorId, empresaId: p.empresaId },
        currentUser,
      );
      if (!canAccess) {
        throw new ForbiddenException('No tiene permisos para acceder a esta práctica');
      }
    }

    return p;
  }

  async createPractica(dto: any, user: { id: number; rol: Rol }) {
    const payload = { ...dto };

    if (user.rol === Rol.ASESOR) {
      const asesor = await this.prisma.asesor.findUnique({
        where: { usuarioId: user.id },
        select: { id: true },
      });

      if (!asesor) throw new NotFoundException('Perfil de asesor no encontrado');
      payload.asesorId = asesor.id;
    }

    this.normalizeDateField(payload, 'fechaInicio', 'fechaInicio');
    this.normalizeDateField(payload, 'fechaFin', 'fechaFin');

    return this.prisma.practica.create({
      data: payload,
      include: { estudiante: true, empresa: true },
    });
  }

  async updatePractica(id: number, dto: any, currentUser?: { id: number; rol: string }) {
    await this.findOnePractica(id, currentUser);
    const payload = { ...dto };
    this.normalizeDateField(payload, 'fechaInicio', 'fechaInicio');
    this.normalizeDateField(payload, 'fechaFin', 'fechaFin');
    return this.prisma.practica.update({ where: { id }, data: payload });
  }

  // ---- Seguimientos ----
  async createSeguimiento(practicaId: number, dto: any, currentUser?: { id: number; rol: string }) {
    const practica = await this.findOnePractica(practicaId, currentUser);
    if (practica.estado === EstadoPractica.COMPLETADA || practica.estado === EstadoPractica.CANCELADA) {
      throw new ForbiddenException('No se puede agregar seguimiento a una práctica finalizada');
    }

    const seguimiento = await this.prisma.seguimiento.create({
      data: { practicaId, ...dto },
    });

    // Actualizar horas acumuladas
    const totalHoras = await this.prisma.seguimiento.aggregate({
      where: { practicaId },
      _sum: { horasEjecutadas: true },
    });
    await this.prisma.practica.update({
      where: { id: practicaId },
      data: { horasTotales: totalHoras._sum.horasEjecutadas || 0 },
    });

    return seguimiento;
  }

  async findSeguimientosByPractica(practicaId: number, currentUser?: { id: number; rol: string }) {
    await this.findOnePractica(practicaId, currentUser);
    return this.prisma.seguimiento.findMany({
      where: { practicaId },
      orderBy: { fecha: 'asc' },
    });
  }

  async updateSeguimiento(id: number, dto: any, currentUser?: { id: number; rol: string }) {
    const seg = await this.prisma.seguimiento.findUnique({
      where: { id },
      include: {
        practica: {
          select: { estudianteId: true, asesorId: true, empresaId: true },
        },
      },
    });
    if (!seg) throw new NotFoundException(`Seguimiento #${id} no encontrado`);

    if (currentUser) {
      const canAccess = await this.canAccessPractica(
        {
          estudianteId: seg.practica.estudianteId,
          asesorId: seg.practica.asesorId,
          empresaId: seg.practica.empresaId,
        },
        currentUser,
      );
      if (!canAccess) {
        throw new ForbiddenException('No tiene permisos para modificar este seguimiento');
      }
    }

    return this.prisma.seguimiento.update({ where: { id }, data: dto });
  }
}
