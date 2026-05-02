import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Rol } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { rol?: Rol; activo?: boolean; page?: number; limit?: number }) {
    const { rol, activo, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (rol) where.rol = rol;
    if (activo !== undefined) where.activo = activo;

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          rol: true,
          activo: true,
          createdAt: true,
          estudiante: { select: { nombres: true, apellidos: true, codigo: true } },
          asesor: { select: { nombres: true, apellidos: true } },
          empresa: { select: { razonSocial: true, ruc: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        estudiante: true,
        asesor: true,
        empresa: true,
      },
    });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
    return user;
  }

  async update(id: number, dto: { email?: string; password?: string; activo?: boolean; rol?: Rol }) {
    await this.findOne(id);
    if (dto.email) {
      const exists = await this.prisma.usuario.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (exists) throw new ConflictException('El email ya está en uso');
    }
    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, email: true, rol: true, activo: true, updatedAt: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.usuario.update({ where: { id }, data: { activo: false } });
    return { message: 'Usuario desactivado correctamente' };
  }
}
