import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoPractica, Rol } from '@prisma/client';

@Injectable()
export class SeguimientoService {
  constructor(private prisma: PrismaService) {}

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
    if (estudianteId) where.estudianteId = estudianteId;
    if (empresaId) where.empresaId = empresaId;

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

  async findOnePractica(id: number) {
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

  async updatePractica(id: number, dto: any) {
    await this.findOnePractica(id);
    const payload = { ...dto };
    this.normalizeDateField(payload, 'fechaInicio', 'fechaInicio');
    this.normalizeDateField(payload, 'fechaFin', 'fechaFin');
    return this.prisma.practica.update({ where: { id }, data: payload });
  }

  // ---- Seguimientos ----
  async createSeguimiento(practicaId: number, dto: any) {
    const practica = await this.findOnePractica(practicaId);
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

  async findSeguimientosByPractica(practicaId: number) {
    await this.findOnePractica(practicaId);
    return this.prisma.seguimiento.findMany({
      where: { practicaId },
      orderBy: { fecha: 'asc' },
    });
  }

  async updateSeguimiento(id: number, dto: any) {
    const seg = await this.prisma.seguimiento.findUnique({ where: { id } });
    if (!seg) throw new NotFoundException(`Seguimiento #${id} no encontrado`);
    return this.prisma.seguimiento.update({ where: { id }, data: dto });
  }
}
