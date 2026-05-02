import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Rol } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user || !user.activo) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    // Cargar perfil según rol
    let perfil: any = null;
    if (user.rol === Rol.ESTUDIANTE) {
      perfil = await this.prisma.estudiante.findUnique({ where: { usuarioId: user.id } });
    } else if (user.rol === Rol.ASESOR) {
      perfil = await this.prisma.asesor.findUnique({ where: { usuarioId: user.id } });
    } else if (user.rol === Rol.EMPRESA) {
      perfil = await this.prisma.empresa.findUnique({ where: { usuarioId: user.id } });
    }

    const payload = { email: user.email, sub: user.id, rol: user.rol };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        perfil,
      },
    };
  }

  async register(dto: {
    email: string;
    password: string;
    rol?: Rol;
    nombres?: string;
    apellidos?: string;
    codigo?: string;
    dni?: string;
    ciclo?: number;
    especialidad?: string;
  }) {
    const exists = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    const hashed = await bcrypt.hash(dto.password, 10);
    const rol = dto.rol || Rol.ESTUDIANTE;

    const usuario = await this.prisma.usuario.create({
      data: { email: dto.email, password: hashed, rol },
    });

    // Crear perfil automáticamente si es estudiante
    if (rol === Rol.ESTUDIANTE && dto.nombres && dto.codigo && dto.dni) {
      await this.prisma.estudiante.create({
        data: {
          usuarioId: usuario.id,
          nombres: dto.nombres,
          apellidos: dto.apellidos || '',
          codigo: dto.codigo,
          dni: dto.dni,
          ciclo: dto.ciclo || 1,
          especialidad: dto.especialidad || '',
        },
      });
    }

    const { password: _, ...result } = usuario;
    return result;
  }

  async getProfile(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        estudiante: true,
        asesor: true,
        empresa: true,
      },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return user;
  }
}
