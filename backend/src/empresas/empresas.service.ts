import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { sector?: string; activo?: boolean; search?: string; page?: number; limit?: number }) {
    const { sector, activo, search, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (sector) where.sector = { contains: sector, mode: 'insensitive' };
    if (activo !== undefined) where.usuario = { ...(where.usuario || {}), activo };
    if (search) {
      where.OR = [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { ruc: { contains: search, mode: 'insensitive' } },
        { contactoNombre: { contains: search, mode: 'insensitive' } },
        { contactoEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.empresa.findMany({
        where,
        skip,
        take: limit,
        include: {
          usuario: { select: { id: true, email: true, activo: true } },
          _count: { select: { ofertas: true, convenios: true } },
        },
        orderBy: { razonSocial: 'asc' },
      }),
      this.prisma.empresa.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const emp = await this.prisma.empresa.findUnique({
      where: { id },
      include: {
        usuario: { select: { email: true, activo: true } },
        ofertas: true,
        convenios: true,
        practicas: { include: { estudiante: true } },
      },
    });
    if (!emp) throw new NotFoundException(`Empresa #${id} no encontrada`);
    return emp;
  }

  async findByUsuario(usuarioId: number) {
    const emp = await this.prisma.empresa.findUnique({
      where: { usuarioId },
      include: { ofertas: true, convenios: true },
    });
    if (!emp) throw new NotFoundException('Perfil de empresa no encontrado');
    return emp;
  }

  async create(dto: any) {
    const required = ['email', 'password', 'razonSocial', 'ruc'];
    const missing = required.filter((key) => !dto?.[key]);
    if (missing.length) {
      throw new BadRequestException(`Campos requeridos: ${missing.join(', ')}`);
    }

    const [existsEmail, existsRuc] = await Promise.all([
      this.prisma.usuario.findUnique({ where: { email: dto.email }, select: { id: true } }),
      this.prisma.empresa.findUnique({ where: { ruc: dto.ruc }, select: { id: true } }),
    ]);

    if (existsEmail) throw new ConflictException('El email ya esta registrado');
    if (existsRuc) throw new ConflictException('El RUC ya esta registrado');

    const hashed = await bcrypt.hash(String(dto.password), 10);

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email: String(dto.email),
          password: hashed,
          rol: Rol.EMPRESA,
        },
      });

      return tx.empresa.create({
        data: {
          usuarioId: usuario.id,
          razonSocial: String(dto.razonSocial),
          ruc: String(dto.ruc),
          direccion: dto.direccion ? String(dto.direccion) : null,
          telefono: dto.telefono ? String(dto.telefono) : null,
          sector: dto.sector ? String(dto.sector) : null,
          contactoNombre: dto.contactoNombre ? String(dto.contactoNombre) : null,
          contactoEmail: dto.contactoEmail ? String(dto.contactoEmail) : null,
        },
        include: { usuario: { select: { id: true, email: true, activo: true } } },
      });
    });
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.empresa.update({ where: { id }, data: dto });
  }

  async updateByUsuario(usuarioId: number, dto: any) {
    return this.prisma.empresa.update({ where: { usuarioId }, data: dto });
  }
}
