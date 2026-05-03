import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  private escapeCsv(value: unknown) {
    const str = `${value ?? ''}`;
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private toCsv(headers: string[], rows: Array<Array<unknown>>) {
    const head = headers.map((h) => this.escapeCsv(h)).join(',');
    const body = rows
      .map((row) => row.map((cell) => this.escapeCsv(cell)).join(','))
      .join('\n');
    return `${head}\n${body}`;
  }

  async reportePracticas(params: { fechaInicio?: Date; fechaFin?: Date; estado?: string }) {
    const where: any = {};
    if (params.estado) where.estado = params.estado;
    if (params.fechaInicio || params.fechaFin) {
      where.fechaInicio = {};
      if (params.fechaInicio) where.fechaInicio.gte = params.fechaInicio;
      if (params.fechaFin) where.fechaInicio.lte = params.fechaFin;
    }

    const practicas = await this.prisma.practica.findMany({
      where,
      include: {
        estudiante: { select: { nombres: true, apellidos: true, codigo: true, especialidad: true } },
        empresa: { select: { razonSocial: true, ruc: true, sector: true } },
        asesor: { select: { nombres: true, apellidos: true } },
      },
      orderBy: { fechaInicio: 'desc' },
    });

    const resumen = {
      total: practicas.length,
      porEstado: practicas.reduce((acc, p) => {
        acc[p.estado] = (acc[p.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      horasTotales: practicas.reduce((sum, p) => sum + p.horasTotales, 0),
    };

    return { resumen, practicas };
  }

  async reporteTesis(params: { estado?: string; tipo?: string }) {
    const where: any = {};
    if (params.estado) where.estado = params.estado;
    if (params.tipo) where.tipo = params.tipo;

    const tesis = await this.prisma.tesis.findMany({
      where,
      include: {
        estudiante: { select: { nombres: true, apellidos: true, codigo: true, especialidad: true } },
        asesor: { select: { nombres: true, apellidos: true } },
        _count: { select: { avances: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const resumen = {
      total: tesis.length,
      porEstado: tesis.reduce((acc, t) => {
        acc[t.estado] = (acc[t.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porTipo: tesis.reduce((acc, t) => {
        acc[t.tipo] = (acc[t.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return { resumen, tesis };
  }

  async reporteEmpresas() {
    const empresas = await this.prisma.empresa.findMany({
      include: {
        _count: { select: { ofertas: true, convenios: true, practicas: true } },
      },
      orderBy: { razonSocial: 'asc' },
    });
    return { total: empresas.length, empresas };
  }

  async exportPracticasCsv(params: { fechaInicio?: Date; fechaFin?: Date; estado?: string }) {
    const reporte = await this.reportePracticas(params);
    const headers = [
      'id',
      'estado',
      'fechaInicio',
      'fechaFin',
      'horasTotales',
      'estudianteCodigo',
      'estudianteNombres',
      'estudianteApellidos',
      'empresa',
      'asesor',
    ];

    const rows = reporte.practicas.map((p) => [
      p.id,
      p.estado,
      p.fechaInicio.toISOString(),
      p.fechaFin ? p.fechaFin.toISOString() : '',
      p.horasTotales,
      p.estudiante.codigo,
      p.estudiante.nombres,
      p.estudiante.apellidos,
      p.empresa.razonSocial,
      p.asesor ? `${p.asesor.nombres} ${p.asesor.apellidos}` : '',
    ]);

    return this.toCsv(headers, rows);
  }

  async exportTesisCsv(params: { estado?: string; tipo?: string }) {
    const reporte = await this.reporteTesis(params);
    const headers = [
      'id',
      'estado',
      'tipo',
      'titulo',
      'estudianteCodigo',
      'estudianteNombres',
      'estudianteApellidos',
      'asesor',
      'avancesCount',
    ];

    const rows = reporte.tesis.map((t) => [
      t.id,
      t.estado,
      t.tipo,
      t.titulo,
      t.estudiante.codigo,
      t.estudiante.nombres,
      t.estudiante.apellidos,
      t.asesor ? `${t.asesor.nombres} ${t.asesor.apellidos}` : '',
      t._count.avances,
    ]);

    return this.toCsv(headers, rows);
  }

  async exportEmpresasCsv() {
    const reporte = await this.reporteEmpresas();
    const headers = [
      'id',
      'razonSocial',
      'ruc',
      'sector',
      'contactoNombre',
      'contactoEmail',
      'ofertas',
      'convenios',
      'practicas',
    ];

    const rows = reporte.empresas.map((e) => [
      e.id,
      e.razonSocial,
      e.ruc,
      e.sector,
      e.contactoNombre,
      e.contactoEmail,
      e._count.ofertas,
      e._count.convenios,
      e._count.practicas,
    ]);

    return this.toCsv(headers, rows);
  }
}
