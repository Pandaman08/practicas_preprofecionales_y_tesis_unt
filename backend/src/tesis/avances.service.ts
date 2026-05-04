import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '@prisma/client';

@Injectable()
export class AvancesService {
  constructor(private prisma: PrismaService) {}

  private async canAccessTesis(
    tesis: { estudianteId: number; asesorId: number | null },
    currentUser?: { id: number; rol: string },
  ) {
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

  async findByTesis(tesisId: number, currentUser?: { id: number; rol: string }) {
    const tesis = await this.prisma.tesis.findUnique({ where: { id: tesisId } });
    if (!tesis) throw new NotFoundException(`Tesis #${tesisId} no encontrada`);

    if (currentUser) {
      const canAccess = await this.canAccessTesis(
        { estudianteId: tesis.estudianteId, asesorId: tesis.asesorId },
        currentUser,
      );
      if (!canAccess) {
        throw new ForbiddenException('No tiene permisos para acceder a los avances de esta tesis');
      }
    }

    return this.prisma.avanceTesis.findMany({
      where: { tesisId },
      orderBy: { fecha: 'asc' },
    });
  }

  async create(tesisId: number, dto: any, currentUser?: { id: number; rol: string }) {
    const tesis = await this.prisma.tesis.findUnique({ where: { id: tesisId } });
    if (!tesis) throw new NotFoundException(`Tesis #${tesisId} no encontrada`);

    if (currentUser) {
      const canAccess = await this.canAccessTesis(
        { estudianteId: tesis.estudianteId, asesorId: tesis.asesorId },
        currentUser,
      );
      if (!canAccess) {
        throw new ForbiddenException('No tiene permisos para registrar avances en esta tesis');
      }
    }

    const avance = await this.prisma.avanceTesis.create({
      data: { tesisId, ...dto },
    });

    // Calcular porcentaje promedio
    const avances = await this.prisma.avanceTesis.findMany({ where: { tesisId } });
    const promedio = avances.reduce((sum, a) => sum + a.porcentaje, 0) / avances.length;

    // Auto-actualizar estado según avance
    if (promedio >= 100) {
      await this.prisma.tesis.update({
        where: { id: tesisId },
        data: { estado: 'LISTA_SUSTENTACION' },
      });
    }

    return avance;
  }

  async update(id: number, dto: any, currentUser?: { id: number; rol: string }) {
    const avance = await this.prisma.avanceTesis.findUnique({
      where: { id },
      include: {
        tesis: {
          select: { estudianteId: true, asesorId: true },
        },
      },
    });
    if (!avance) throw new NotFoundException(`Avance #${id} no encontrado`);

    if (currentUser) {
      const canAccess = await this.canAccessTesis(
        { estudianteId: avance.tesis.estudianteId, asesorId: avance.tesis.asesorId },
        currentUser,
      );
      if (!canAccess) {
        throw new ForbiddenException('No tiene permisos para actualizar este avance');
      }
    }

    return this.prisma.avanceTesis.update({ where: { id }, data: dto });
  }

  async remove(id: number, currentUser?: { id: number; rol: string }) {
    const avance = await this.prisma.avanceTesis.findUnique({
      where: { id },
      include: {
        tesis: {
          select: { estudianteId: true, asesorId: true },
        },
      },
    });
    if (!avance) throw new NotFoundException(`Avance #${id} no encontrado`);

    if (currentUser) {
      const canAccess = await this.canAccessTesis(
        { estudianteId: avance.tesis.estudianteId, asesorId: avance.tesis.asesorId },
        currentUser,
      );
      if (!canAccess) {
        throw new ForbiddenException('No tiene permisos para eliminar este avance');
      }
    }

    return this.prisma.avanceTesis.delete({ where: { id } });
  }
}
