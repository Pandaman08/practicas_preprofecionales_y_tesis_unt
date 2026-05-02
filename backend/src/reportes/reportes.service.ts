import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

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
}
