import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '@prisma/client';

type KpiItem = {
  key: string;
  label: string;
  value: number;
  hint?: string;
};

type TrendInfo = {
  label: string;
  current: number;
  previous: number;
  delta: number;
  percent: number;
};

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getCurrentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private getPreviousMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
  }

  private buildTrend(label: string, current: number, previous: number): TrendInfo {
    const delta = current - previous;
    const percent = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((delta / previous) * 100);
    return {
      label,
      current,
      previous,
      delta,
      percent,
    };
  }

  private normalizeName(input?: string | null) {
    return input ? input : 'Sin nombre';
  }

  async getStats() {
    const [
      usuariosActivos,
      totalEstudiantes,
      totalEmpresas,
      totalAsesores,
      practicasEnCurso,
      practicasCompletadas,
      tesisEnDesarrollo,
      tesisSustentadas,
      ofertasActivas,
      postulacionesPendientes,
      conveniosActivos,
    ] = await Promise.all([
      this.prisma.usuario.count({ where: { activo: true } }),
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
      usuarios: { activos: usuariosActivos },
      estudiantes: { total: totalEstudiantes },
      empresas: { total: totalEmpresas },
      asesores: { total: totalAsesores },
      practicas: { enCurso: practicasEnCurso, completadas: practicasCompletadas },
      tesis: { enDesarrollo: tesisEnDesarrollo, sustentadas: tesisSustentadas },
      ofertas: { activas: ofertasActivas },
      postulaciones: { pendientes: postulacionesPendientes },
      convenios: { activos: conveniosActivos },
    };
  }

  async getStatsByUser(userId: number, rol: Rol) {
    const currentMonth = this.getCurrentMonthRange();
    const previousMonth = this.getPreviousMonthRange();

    if (rol === Rol.ADMIN || rol === Rol.COORDINADOR) {
      const [
        usuariosActivos,
        totalEstudiantes,
        totalAsesores,
        totalEmpresas,
        practicasEnCurso,
        tesisEnDesarrollo,
        ofertasActivas,
        conveniosActivos,
        postCurrent,
        postPrevious,
      ] = await Promise.all([
        this.prisma.usuario.count({ where: { activo: true } }),
        this.prisma.estudiante.count(),
        this.prisma.asesor.count(),
        this.prisma.empresa.count(),
        this.prisma.practica.count({ where: { estado: 'EN_CURSO' } }),
        this.prisma.tesis.count({ where: { estado: 'EN_DESARROLLO' } }),
        this.prisma.oferta.count({ where: { activo: true } }),
        this.prisma.convenio.count({ where: { estado: 'ACTIVO' } }),
        this.prisma.postulacion.count({ where: { createdAt: { gte: currentMonth.start, lte: currentMonth.end } } }),
        this.prisma.postulacion.count({ where: { createdAt: { gte: previousMonth.start, lte: previousMonth.end } } }),
      ]);

      const trend = this.buildTrend('Postulaciones del mes', postCurrent, postPrevious);
      const kpis: KpiItem[] = [
        { key: 'usuariosActivos', label: 'Usuarios activos', value: usuariosActivos },
        { key: 'estudiantes', label: 'Estudiantes', value: totalEstudiantes },
        { key: 'asesores', label: 'Asesores', value: totalAsesores },
        { key: 'empresas', label: 'Empresas', value: totalEmpresas },
        { key: 'practicasEnCurso', label: 'Practicas en curso', value: practicasEnCurso },
        { key: 'tesisEnDesarrollo', label: 'Tesis en desarrollo', value: tesisEnDesarrollo },
        { key: 'ofertasActivas', label: 'Ofertas activas', value: ofertasActivas },
        { key: 'conveniosActivos', label: 'Convenios activos', value: conveniosActivos },
      ];

      return {
        role: rol,
        title: rol === Rol.ADMIN ? 'Vision general institucional' : 'Control operativo academico',
        kpis,
        trend,
        highlights: [
          `Total de postulaciones este mes: ${postCurrent}`,
          `Variacion mensual: ${trend.percent}%`,
        ],
      };
    }

    if (rol === Rol.ASESOR) {
      const asesor = await this.prisma.asesor.findUnique({ where: { usuarioId: userId } });
      if (!asesor) return { role: rol, title: 'Sin perfil de asesor', kpis: [], highlights: [] };

      const [
        practicasAsignadas,
        practicasEnCurso,
        practicasCompletadas,
        tesisAsignadas,
        tesisEnDesarrollo,
        avancesCurrent,
        avancesPrevious,
      ] = await Promise.all([
        this.prisma.practica.count({ where: { asesorId: asesor.id } }),
        this.prisma.practica.count({ where: { asesorId: asesor.id, estado: 'EN_CURSO' } }),
        this.prisma.practica.count({ where: { asesorId: asesor.id, estado: 'COMPLETADA' } }),
        this.prisma.tesis.count({ where: { asesorId: asesor.id } }),
        this.prisma.tesis.count({ where: { asesorId: asesor.id, estado: 'EN_DESARROLLO' } }),
        this.prisma.avanceTesis.count({
          where: { tesis: { asesorId: asesor.id }, createdAt: { gte: currentMonth.start, lte: currentMonth.end } },
        }),
        this.prisma.avanceTesis.count({
          where: { tesis: { asesorId: asesor.id }, createdAt: { gte: previousMonth.start, lte: previousMonth.end } },
        }),
      ]);

      const trend = this.buildTrend('Avances de tesis del mes', avancesCurrent, avancesPrevious);
      const kpis: KpiItem[] = [
        { key: 'practicasAsignadas', label: 'Practicas asignadas', value: practicasAsignadas },
        { key: 'practicasEnCurso', label: 'Practicas en curso', value: practicasEnCurso },
        { key: 'practicasCompletadas', label: 'Practicas completadas', value: practicasCompletadas },
        { key: 'tesisAsignadas', label: 'Tesis asignadas', value: tesisAsignadas },
        { key: 'tesisEnDesarrollo', label: 'Tesis en desarrollo', value: tesisEnDesarrollo },
        { key: 'avancesMes', label: 'Avances registrados (mes)', value: avancesCurrent },
      ];

      return {
        role: rol,
        title: `Gestion academica de ${this.normalizeName(asesor.nombres)}`,
        kpis,
        trend,
        highlights: [
          `Avances registrados en el periodo actual: ${avancesCurrent}`,
          `Variacion respecto al mes anterior: ${trend.percent}%`,
        ],
      };
    }

    if (rol === Rol.ESTUDIANTE) {
      const est = await this.prisma.estudiante.findUnique({ where: { usuarioId: userId } });
      if (!est) return { role: rol, title: 'Sin perfil de estudiante', kpis: [], highlights: [] };

      const [
        postulacionesTotales,
        postulacionesPendientes,
        practicasEnCurso,
        practicasCompletadas,
        tesisActivas,
        avancesCurrent,
        avancesPrevious,
      ] = await Promise.all([
        this.prisma.postulacion.count({ where: { estudianteId: est.id } }),
        this.prisma.postulacion.count({ where: { estudianteId: est.id, estado: 'PENDIENTE' } }),
        this.prisma.practica.count({ where: { estudianteId: est.id, estado: 'EN_CURSO' } }),
        this.prisma.practica.count({ where: { estudianteId: est.id, estado: 'COMPLETADA' } }),
        this.prisma.tesis.count({ where: { estudianteId: est.id, estado: { in: ['APROBADA', 'EN_DESARROLLO', 'LISTA_SUSTENTACION', 'OBSERVADA'] } } }),
        this.prisma.avanceTesis.count({
          where: {
            tesis: { estudianteId: est.id },
            createdAt: { gte: currentMonth.start, lte: currentMonth.end },
          },
        }),
        this.prisma.avanceTesis.count({
          where: {
            tesis: { estudianteId: est.id },
            createdAt: { gte: previousMonth.start, lte: previousMonth.end },
          },
        }),
      ]);

      const trend = this.buildTrend('Avances academicos del mes', avancesCurrent, avancesPrevious);
      const kpis: KpiItem[] = [
        { key: 'postulacionesTotales', label: 'Postulaciones', value: postulacionesTotales },
        { key: 'postulacionesPendientes', label: 'Postulaciones pendientes', value: postulacionesPendientes },
        { key: 'practicasEnCurso', label: 'Practicas en curso', value: practicasEnCurso },
        { key: 'practicasCompletadas', label: 'Practicas completadas', value: practicasCompletadas },
        { key: 'tesisActivas', label: 'Tesis activas', value: tesisActivas },
        { key: 'avancesMes', label: 'Avances del mes', value: avancesCurrent },
      ];

      return {
        role: rol,
        title: `Progreso academico de ${this.normalizeName(est.nombres)}`,
        kpis,
        trend,
        highlights: [
          `Ciclo actual: ${est.ciclo}`,
          `Especialidad: ${est.especialidad}`,
        ],
      };
    }

    if (rol === Rol.EMPRESA) {
      const empresa = await this.prisma.empresa.findUnique({ where: { usuarioId: userId } });
      if (!empresa) return { role: rol, title: 'Sin perfil de empresa', kpis: [], highlights: [] };

      const [
        ofertasActivas,
        ofertasTotales,
        postulacionesPendientes,
        postulacionesTotales,
        practicasEnCurso,
        conveniosActivos,
        ofertasCurrent,
        ofertasPrevious,
      ] = await Promise.all([
        this.prisma.oferta.count({ where: { empresaId: empresa.id, activo: true } }),
        this.prisma.oferta.count({ where: { empresaId: empresa.id } }),
        this.prisma.postulacion.count({ where: { oferta: { empresaId: empresa.id }, estado: 'PENDIENTE' } }),
        this.prisma.postulacion.count({ where: { oferta: { empresaId: empresa.id } } }),
        this.prisma.practica.count({ where: { empresaId: empresa.id, estado: 'EN_CURSO' } }),
        this.prisma.convenio.count({ where: { empresaId: empresa.id, estado: 'ACTIVO' } }),
        this.prisma.oferta.count({ where: { empresaId: empresa.id, createdAt: { gte: currentMonth.start, lte: currentMonth.end } } }),
        this.prisma.oferta.count({ where: { empresaId: empresa.id, createdAt: { gte: previousMonth.start, lte: previousMonth.end } } }),
      ]);

      const trend = this.buildTrend('Ofertas publicadas del mes', ofertasCurrent, ofertasPrevious);
      const kpis: KpiItem[] = [
        { key: 'ofertasActivas', label: 'Ofertas activas', value: ofertasActivas },
        { key: 'ofertasTotales', label: 'Ofertas totales', value: ofertasTotales },
        { key: 'postulacionesPendientes', label: 'Postulaciones pendientes', value: postulacionesPendientes },
        { key: 'postulacionesTotales', label: 'Postulaciones recibidas', value: postulacionesTotales },
        { key: 'practicasEnCurso', label: 'Practicas en curso', value: practicasEnCurso },
        { key: 'conveniosActivos', label: 'Convenios activos', value: conveniosActivos },
      ];

      return {
        role: rol,
        title: `Indicadores de ${this.normalizeName(empresa.razonSocial)}`,
        kpis,
        trend,
        highlights: [
          `Postulaciones totales recibidas: ${postulacionesTotales}`,
          `Variacion mensual de ofertas: ${trend.percent}%`,
        ],
      };
    }

    return {
      role: rol,
      title: 'Resumen general',
      kpis: [],
      highlights: [],
    };
  }
}
