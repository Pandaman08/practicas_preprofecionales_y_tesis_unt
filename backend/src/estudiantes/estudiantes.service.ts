import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EstudiantesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    const required = ['email', 'password', 'nombres', 'apellidos', 'codigo', 'dni', 'ciclo', 'especialidad'];
    const missing = required.filter((key) => !dto?.[key]);
    if (missing.length) {
      throw new BadRequestException(`Campos requeridos: ${missing.join(', ')}`);
    }

    const [existsEmail, existsCodigo, existsDni] = await Promise.all([
      this.prisma.usuario.findUnique({ where: { email: dto.email }, select: { id: true } }),
      this.prisma.estudiante.findUnique({ where: { codigo: dto.codigo }, select: { id: true } }),
      this.prisma.estudiante.findUnique({ where: { dni: dto.dni }, select: { id: true } }),
    ]);

    if (existsEmail) throw new ConflictException('El email ya esta registrado');
    if (existsCodigo) throw new ConflictException('El codigo ya esta registrado');
    if (existsDni) throw new ConflictException('El DNI ya esta registrado');

    const hashed = await bcrypt.hash(String(dto.password), 10);

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email: String(dto.email),
          password: hashed,
          rol: Rol.ESTUDIANTE,
        },
      });

      return tx.estudiante.create({
        data: {
          usuarioId: usuario.id,
          nombres: String(dto.nombres),
          apellidos: String(dto.apellidos),
          codigo: String(dto.codigo),
          dni: String(dto.dni),
          ciclo: Number(dto.ciclo),
          especialidad: String(dto.especialidad),
          telefono: dto.telefono ? String(dto.telefono) : null,
          direccion: dto.direccion ? String(dto.direccion) : null,
        },
        include: { usuario: { select: { id: true, email: true, activo: true } } },
      });
    });
  }

  async findAll(
    params: { especialidad?: string; ciclo?: number; activo?: boolean; search?: string; page?: number; limit?: number },
    user: { id: number; rol: Rol },
  ) {
    const { especialidad, ciclo, activo, search, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    const andFilters: any[] = [];

    if (search) {
      andFilters.push({
        OR: [
        { nombres: { contains: search, mode: 'insensitive' } },
        { apellidos: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search, mode: 'insensitive' } },
        { usuario: { email: { contains: search, mode: 'insensitive' } } },
      ],
      });
    }
    if (especialidad) where.especialidad = { contains: especialidad, mode: 'insensitive' };
    if (ciclo) where.ciclo = ciclo;
    if (activo !== undefined) where.usuario = { ...(where.usuario || {}), activo };

    if (user.rol === Rol.ASESOR) {
      const asesor = await this.prisma.asesor.findUnique({ where: { usuarioId: user.id } });
      if (!asesor) throw new NotFoundException('Perfil de asesor no encontrado');
      andFilters.push({
        OR: [
        { practicas: { some: { asesorId: asesor.id } } },
        { tesis: { some: { asesorId: asesor.id } } },
      ],
      });
    }

    if (user.rol === Rol.EMPRESA) {
      const empresa = await this.prisma.empresa.findUnique({ where: { usuarioId: user.id } });
      if (!empresa) throw new NotFoundException('Perfil de empresa no encontrado');
      andFilters.push({
        OR: [
        { practicas: { some: { empresaId: empresa.id } } },
        { postulaciones: { some: { oferta: { empresaId: empresa.id } } } },
      ],
      });
    }

    if (andFilters.length) {
      where.AND = andFilters;
    }

    const [data, total] = await Promise.all([
      this.prisma.estudiante.findMany({
        where,
        skip,
        take: limit,
        include: { usuario: { select: { id: true, email: true, activo: true } } },
        orderBy: { apellidos: 'asc' },
      }),
      this.prisma.estudiante.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number, user: { id: number; rol: Rol }) {
    const est = await this.prisma.estudiante.findUnique({
      where: { id },
      include: {
        usuario: { select: { email: true, activo: true, createdAt: true } },
        practicas: { include: { empresa: true, asesor: true } },
        tesis: { include: { asesor: true } },
        postulaciones: { include: { oferta: { include: { empresa: true } } } },
      },
    });
    if (!est) throw new NotFoundException(`Estudiante #${id} no encontrado`);

    if (user.rol === Rol.ASESOR) {
      const asesor = await this.prisma.asesor.findUnique({ where: { usuarioId: user.id } });
      const allowed = !!asesor && (
        est.practicas.some((p) => p.asesorId === asesor.id) ||
        est.tesis.some((t) => t.asesorId === asesor.id)
      );
      if (!allowed) throw new NotFoundException(`Estudiante #${id} no encontrado`);
    }

    if (user.rol === Rol.EMPRESA) {
      const empresa = await this.prisma.empresa.findUnique({ where: { usuarioId: user.id } });
      const allowed = !!empresa && (
        est.practicas.some((p) => p.empresaId === empresa.id) ||
        est.postulaciones.some((p) => p.oferta.empresaId === empresa.id)
      );
      if (!allowed) throw new NotFoundException(`Estudiante #${id} no encontrado`);
    }

    return est;
  }

  async findByUsuario(usuarioId: number) {
    const est = await this.prisma.estudiante.findUnique({
      where: { usuarioId },
      include: { practicas: true, tesis: true },
    });
    if (!est) throw new NotFoundException('Perfil de estudiante no encontrado');
    return est;
  }

  async update(id: number, dto: any) {
    const exists = await this.prisma.estudiante.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException(`Estudiante #${id} no encontrado`);
    return this.prisma.estudiante.update({
      where: { id },
      data: dto,
    });
  }

  async updateByUsuario(usuarioId: number, dto: any) {
    return this.prisma.estudiante.update({
      where: { usuarioId },
      data: dto,
    });
  }
}
