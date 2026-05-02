import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalEstudiantes,
      totalEmpresas,
      totalAsesores,
      practicasActivas,
      practicasCompletadas,
      tesisEnDesarrollo,
      tesisSustentadas,
      ofertasActivas,
      postulacionesPendientes,
      conveniosActivos,
    ] = await Promise.all([
      this.prisma.estudiante.count(),
      this.prisma.empresa.count(),
      this.prisma.asesor.count(),
      this.prisma.practica.count({ where: { estado: 'EN_CURSO' } }),
      this.prisma.practica.count({ where: { estado: 'COMPLETADA' } }),
      this.prisma.tesis.count({ where: { estado: 'EN_DESARROLLO' } }),
      this.prisma.tesis.count({ where: { estado: 'SUSTENTADA' } }),
      this.prisma.oferta.count({ where: { activo: true } }),
      this.prisma.postulacion.count({ where: { estado: 'PENDIENTE' } }),
      this.prisma.convenio.count({ where: { estado: 'ACTIVO' } }),
    ]);

    return {
      estudiantes: { total: totalEstudiantes },
      empresas: { total: totalEmpresas },
      asesores: { total: totalAsesores },
      practicas: { activas: practicasActivas, completadas: practicasCompletadas },
      tesis: { enDesarrollo: tesisEnDesarrollo, sustentadas: tesisSustentadas },
      ofertas: { activas: ofertasActivas },
      postulaciones: { pendientes: postulacionesPendientes },
      convenios: { activos: conveniosActivos },
    };
  }

  async getStatsByUser(userId: number, rol: Rol) {
    if (rol === Rol.ESTUDIANTE) {
      const est = await this.prisma.estudiante.findUnique({ where: { usuarioId: userId } });
      if (!est) return {};
      const [practicas, tesis, postulaciones] = await Promise.all([
        this.prisma.practica.findMany({
          where: { estudianteId: est.id },
          include: { empresa: { select: { razonSocial: true } } },
          take: 5,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.tesis.findMany({
          where: { estudianteId: est.id },
          include: { asesor: { select: { nombres: true, apellidos: true } } },
        }),
        this.prisma.postulacion.count({ where: { estudianteId: est.id } }),
      ]);
      return { practicas, tesis, totalPostulaciones: postulaciones };
    }

    if (rol === Rol.ASESOR) {
      const asesor = await this.prisma.asesor.findUnique({ where: { usuarioId: userId } });
      if (!asesor) return {};
      const [practicas, tesis] = await Promise.all([
        this.prisma.practica.count({ where: { asesorId: asesor.id } }),
        this.prisma.tesis.count({ where: { asesorId: asesor.id } }),
      ]);
      return { totalPracticas: practicas, totalTesis: tesis };
    }

    if (rol === Rol.EMPRESA) {
      const empresa = await this.prisma.empresa.findUnique({ where: { usuarioId: userId } });
      if (!empresa) return {};
      const [ofertas, postulaciones, practicas] = await Promise.all([
        this.prisma.oferta.count({ where: { empresaId: empresa.id, activo: true } }),
        this.prisma.postulacion.count({
          where: { oferta: { empresaId: empresa.id }, estado: 'PENDIENTE' },
        }),
        this.prisma.practica.count({ where: { empresaId: empresa.id } }),
      ]);
      return { ofertasActivas: ofertas, postulacionesPendientes: postulaciones, totalPracticas: practicas };
    }

    return this.getStats();
  }
}
