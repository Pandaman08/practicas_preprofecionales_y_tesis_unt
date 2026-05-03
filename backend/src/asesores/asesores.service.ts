import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AsesoresService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    const required = ['email', 'password', 'nombres', 'apellidos', 'dni', 'especialidad', 'grado'];
    const missing = required.filter((key) => !dto?.[key]);
    if (missing.length) {
      throw new BadRequestException(`Campos requeridos: ${missing.join(', ')}`);
    }

    const [existsEmail, existsDni] = await Promise.all([
      this.prisma.usuario.findUnique({ where: { email: dto.email }, select: { id: true } }),
      this.prisma.asesor.findUnique({ where: { dni: dto.dni }, select: { id: true } }),
    ]);

    if (existsEmail) throw new ConflictException('El email ya esta registrado');
    if (existsDni) throw new ConflictException('El DNI ya esta registrado');

    const hashed = await bcrypt.hash(String(dto.password), 10);

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email: String(dto.email),
          password: hashed,
          rol: Rol.ASESOR,
        },
      });

      return tx.asesor.create({
        data: {
          usuarioId: usuario.id,
          nombres: String(dto.nombres),
          apellidos: String(dto.apellidos),
          dni: String(dto.dni),
          especialidad: String(dto.especialidad),
          grado: String(dto.grado),
          telefono: dto.telefono ? String(dto.telefono) : null,
        },
        include: { usuario: { select: { id: true, email: true, activo: true } } },
      });
    });
  }

  async findAll(params: { especialidad?: string; activo?: boolean; page?: number; limit?: number }) {
    const { especialidad, activo, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (especialidad) where.especialidad = { contains: especialidad, mode: 'insensitive' };
    if (activo !== undefined) where.usuario = { ...(where.usuario || {}), activo };

    const [data, total] = await Promise.all([
      this.prisma.asesor.findMany({
        where,
        skip,
        take: limit,
        include: { usuario: { select: { id: true, email: true, activo: true } } },
        orderBy: { apellidos: 'asc' },
      }),
      this.prisma.asesor.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const asesor = await this.prisma.asesor.findUnique({
      where: { id },
      include: {
        usuario: { select: { email: true, activo: true } },
        practicas: { include: { estudiante: true } },
        tesis: { include: { estudiante: true } },
      },
    });
    if (!asesor) throw new NotFoundException(`Asesor #${id} no encontrado`);
    return asesor;
  }

  async findByUsuario(usuarioId: number) {
    const asesor = await this.prisma.asesor.findUnique({
      where: { usuarioId },
      include: {
        practicas: { include: { estudiante: true, empresa: true } },
        tesis: { include: { estudiante: true } },
      },
    });
    if (!asesor) throw new NotFoundException('Perfil de asesor no encontrado');
    return asesor;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.asesor.update({ where: { id }, data: dto });
  }

  async updateByUsuario(usuarioId: number, dto: any) {
    return this.prisma.asesor.update({ where: { usuarioId }, data: dto });
  }
}
