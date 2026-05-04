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

  private getDateRangeFromFilters(month?: number, year?: number) {
    if (!year) return undefined;

    if (month && month >= 1 && month <= 12) {
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      return { start, end };
    }

    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }

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

  async getAdminAnalytics(params: {
    month?: number;
    year?: number;
    especialidad?: string;
    estado?: string;
  }) {
    const now = new Date();
    const { month, year, especialidad, estado } = params;
    const range = this.getDateRangeFromFilters(month, year);

    const practicaWhere: any = {};
    const tesisWhere: any = {};
    const postulacionWhere: any = {};

    if (range) {
      practicaWhere.createdAt = { gte: range.start, lte: range.end };
      tesisWhere.createdAt = { gte: range.start, lte: range.end };
      postulacionWhere.createdAt = { gte: range.start, lte: range.end };
    }

    if (especialidad) {
      practicaWhere.estudiante = { especialidad: { contains: especialidad, mode: 'insensitive' } };
      tesisWhere.estudiante = { especialidad: { contains: especialidad, mode: 'insensitive' } };
      postulacionWhere.estudiante = { especialidad: { contains: especialidad, mode: 'insensitive' } };
    }

    if (estado) {
      practicaWhere.estado = estado as any;
      tesisWhere.estado = estado as any;
      postulacionWhere.estado = estado as any;
    }

    const [
      estudiantesTotal,
      asesoresTotal,
      empresasTotal,
      ofertasActivas,
      practicas,
      tesis,
      postulaciones,
      especialidades,
      practicasExpiran,
      practicasRecent,
      tesisRecent,
      postulacionesRecent,
    ] = await Promise.all([
      this.prisma.estudiante.count({
        where: especialidad ? { especialidad: { contains: especialidad, mode: 'insensitive' } } : undefined,
      }),
      this.prisma.asesor.count(),
      this.prisma.empresa.count(),
      this.prisma.oferta.count({ where: { activo: true } }),
      this.prisma.practica.findMany({
        where: practicaWhere,
        include: {
          empresa: { select: { razonSocial: true } },
          estudiante: { select: { especialidad: true } },
        },
      }),
      this.prisma.tesis.findMany({
        where: tesisWhere,
        include: { estudiante: { select: { especialidad: true } } },
      }),
      this.prisma.postulacion.findMany({ where: postulacionWhere }),
      this.prisma.estudiante.groupBy({
        by: ['especialidad'],
        _count: { especialidad: true },
        orderBy: { _count: { especialidad: 'desc' } },
        take: 8,
      }),
      this.prisma.practica.findMany({
        where: {
          estado: { in: ['EN_CURSO', 'PENDIENTE'] },
          fechaFin: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        },
        include: {
          estudiante: { select: { nombres: true, apellidos: true } },
          empresa: { select: { razonSocial: true } },
        },
        take: 6,
        orderBy: { fechaFin: 'asc' },
      }),
      this.prisma.practica.findMany({
        where: practicaWhere,
        select: { id: true, titulo: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.tesis.findMany({
        where: tesisWhere,
        select: { id: true, titulo: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.postulacion.findMany({
        where: postulacionWhere,
        select: { id: true, createdAt: true, estado: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const practicasByEstado = practicas.reduce((acc, item) => {
      acc[item.estado] = (acc[item.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tesisByEstado = tesis.reduce((acc, item) => {
      acc[item.estado] = (acc[item.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const postulacionesByEstado = postulaciones.reduce((acc, item) => {
      acc[item.estado] = (acc[item.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthMap: Record<string, { month: string; practicas: number; tesis: number }> = {};
    const pushMonth = (date: Date, type: 'practicas' | 'tesis') => {
      const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
      if (!monthMap[key]) {
        monthMap[key] = { month: key, practicas: 0, tesis: 0 };
      }
      monthMap[key][type] += 1;
    };

    practicas.forEach((p) => pushMonth(new Date(p.createdAt), 'practicas'));
    tesis.forEach((t) => pushMonth(new Date(t.createdAt), 'tesis'));

    const monthlyTrend = Object.values(monthMap).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    const companyCounter = practicas.reduce((acc, p) => {
      const name = p.empresa?.razonSocial || 'Sin empresa';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const companyDistribution = Object.entries(companyCounter)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const careerDistribution = especialidades.map((item) => ({
      name: item.especialidad || 'Sin especialidad',
      value: item._count.especialidad,
    }));

    const donutStatus = [
      {
        name: 'Practicas activas',
        value: (practicasByEstado.EN_CURSO || 0) + (practicasByEstado.PENDIENTE || 0),
      },
      {
        name: 'Practicas completadas',
        value: practicasByEstado.COMPLETADA || 0,
      },
      {
        name: 'Tesis en proceso',
        value: (tesisByEstado.EN_DESARROLLO || 0) + (tesisByEstado.LISTA_SUSTENTACION || 0),
      },
      {
        name: 'Tesis finalizadas',
        value: (tesisByEstado.SUSTENTADA || 0) + (tesisByEstado.APROBADA || 0),
      },
    ];

    const tesisFinalizadas = (tesisByEstado.SUSTENTADA || 0) + (tesisByEstado.APROBADA || 0);
    const tesisTotal = tesis.length || 1;
    const rendimientoTesis = Math.round((tesisFinalizadas / tesisTotal) * 100);

    const kpis = {
      estudiantesTotal,
      asesoresTotal,
      empresasTotal,
      practicasActivas: (practicasByEstado.EN_CURSO || 0) + (practicasByEstado.PENDIENTE || 0),
      practicasCompletadas: practicasByEstado.COMPLETADA || 0,
      tesisEnProceso: (tesisByEstado.EN_DESARROLLO || 0) + (tesisByEstado.LISTA_SUSTENTACION || 0),
      tesisFinalizadas,
      ofertasActivas,
      postulacionesPendientes: postulacionesByEstado.PENDIENTE || 0,
      postulacionesAceptadas: postulacionesByEstado.ACEPTADA || 0,
      postulacionesRechazadas: postulacionesByEstado.RECHAZADA || 0,
      rendimientoTesis,
    };

    const actionLog = [
      ...practicasRecent.map((item) => ({
        id: `practica-${item.id}`,
        modulo: 'Practicas',
        accion: 'Registro creado',
        fecha: item.createdAt,
        descripcion: item.titulo,
      })),
      ...tesisRecent.map((item) => ({
        id: `tesis-${item.id}`,
        modulo: 'Tesis',
        accion: 'Registro creado',
        fecha: item.createdAt,
        descripcion: item.titulo,
      })),
      ...postulacionesRecent.map((item) => ({
        id: `postulacion-${item.id}`,
        modulo: 'Postulaciones',
        accion: `Estado ${item.estado}`,
        fecha: item.createdAt,
        descripcion: `Postulacion #${item.id}`,
      })),
    ]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 12);

    return {
      filters: {
        month: month || null,
        year: year || null,
        especialidad: especialidad || null,
        estado: estado || null,
      },
      kpis,
      charts: {
        monthlyTrend,
        careerDistribution,
        companyDistribution,
        donutStatus,
      },
      alerts: practicasExpiran.map((item) => ({
        id: item.id,
        titulo: item.titulo,
        empresa: item.empresa.razonSocial,
        estudiante: `${item.estudiante.nombres} ${item.estudiante.apellidos}`,
        fechaFin: item.fechaFin,
      })),
      quickAccess: [
        { label: 'Gestion de estudiantes', href: '/estudiantes' },
        { label: 'Gestion de practicas', href: '/practicas' },
        { label: 'Gestion de tesis', href: '/tesis' },
        { label: 'Modulo de reportes', href: '/reportes' },
      ],
      actionLog,
      generatedAt: new Date().toISOString(),
    };
  }

  async getStatsByUser(userId: number, rol: Rol) {
    const currentMonth = this.getCurrentMonthRange();
    const previousMonth = this.getPreviousMonthRange();

    if (rol === Rol.ADMIN) {
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
        title: 'Vision general institucional',
        kpis,
        trend,
        highlights: [
          `Total de postulaciones este mes: ${postCurrent}`,
          `Variacion mensual: ${trend.percent}%`,
        ],
      };
    }

    if (rol === Rol.COORDINADOR) {
      const [
        practicasEnCurso,
        practicasCompletadas,
        tesisEnDesarrollo,
        tesisObservadas,
        tesisSustentadas,
        postulacionesPendientes,
        seguimientosMes,
        seguimientosMesPrevio,
      ] = await Promise.all([
        this.prisma.practica.count({ where: { estado: 'EN_CURSO' } }),
        this.prisma.practica.count({ where: { estado: 'COMPLETADA' } }),
        this.prisma.tesis.count({ where: { estado: 'EN_DESARROLLO' } }),
        this.prisma.tesis.count({ where: { estado: 'OBSERVADA' } }),
        this.prisma.tesis.count({ where: { estado: 'SUSTENTADA' } }),
        this.prisma.postulacion.count({ where: { estado: 'PENDIENTE' } }),
        this.prisma.seguimiento.count({ where: { createdAt: { gte: currentMonth.start, lte: currentMonth.end } } }),
        this.prisma.seguimiento.count({ where: { createdAt: { gte: previousMonth.start, lte: previousMonth.end } } }),
      ]);

      const trend = this.buildTrend('Seguimientos academicos del mes', seguimientosMes, seguimientosMesPrevio);
      const kpis: KpiItem[] = [
        { key: 'practicasEnCurso', label: 'Practicas en curso', value: practicasEnCurso },
        { key: 'practicasCompletadas', label: 'Practicas completadas', value: practicasCompletadas },
        { key: 'tesisEnDesarrollo', label: 'Tesis en desarrollo', value: tesisEnDesarrollo },
        { key: 'tesisObservadas', label: 'Tesis observadas', value: tesisObservadas },
        { key: 'tesisSustentadas', label: 'Tesis sustentadas', value: tesisSustentadas },
        { key: 'postulacionesPendientes', label: 'Postulaciones pendientes', value: postulacionesPendientes },
      ];

      return {
        role: rol,
        title: 'Seguimiento academico institucional',
        kpis,
        trend,
        highlights: [
          `Seguimientos del periodo: ${seguimientosMes}`,
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
