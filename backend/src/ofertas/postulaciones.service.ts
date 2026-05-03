import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoPostulacion, Rol } from '@prisma/client';

@Injectable()
export class PostulacionesService {
  constructor(private prisma: PrismaService) {}

  async getEstudianteIdByUsuario(usuarioId: number) {
    const estudiante = await this.prisma.estudiante.findUnique({ where: { usuarioId } });
    if (!estudiante) throw new NotFoundException('Perfil de estudiante no encontrado');
    return estudiante.id;
  }

  private async assertEmpresaOwnsOferta(ofertaId: number, usuarioId: number) {
    const oferta = await this.prisma.oferta.findUnique({
      where: { id: ofertaId },
      select: { id: true, empresa: { select: { usuarioId: true } } },
    });
    if (!oferta) throw new NotFoundException(`Oferta #${ofertaId} no encontrada`);
    if (oferta.empresa.usuarioId !== usuarioId) {
      throw new ForbiddenException('No tiene permisos sobre esta oferta');
    }
  }

  async postular(estudianteId: number, ofertaId: number, cartaMotivacion?: string) {
    const oferta = await this.prisma.oferta.findUnique({ where: { id: ofertaId } });
    if (!oferta || !oferta.activo) throw new NotFoundException('Oferta no disponible');

    const existing = await this.prisma.postulacion.findUnique({
      where: { estudianteId_ofertaId: { estudianteId, ofertaId } },
    });
    if (existing) throw new ConflictException('Ya postulaste a esta oferta');

    return this.prisma.postulacion.create({
      data: { estudianteId, ofertaId, cartaMotivacion },
      include: { oferta: { include: { empresa: true } } },
    });
  }

  async findByEstudiante(estudianteId: number) {
    return this.prisma.postulacion.findMany({
      where: { estudianteId },
      include: { oferta: { include: { empresa: true } } },
      orderBy: { fechaPostulacion: 'desc' },
    });
  }

  async findByOferta(ofertaId: number, user: { id: number; rol: Rol }) {
    if (user.rol === Rol.EMPRESA) {
      await this.assertEmpresaOwnsOferta(ofertaId, user.id);
    }

    return this.prisma.postulacion.findMany({
      where: { ofertaId },
      include: { estudiante: true },
      orderBy: { fechaPostulacion: 'asc' },
    });
  }

  async updateEstado(id: number, estado: EstadoPostulacion, user: { id: number; rol: Rol }) {
    const post = await this.prisma.postulacion.findUnique({
      where: { id },
      select: { id: true, ofertaId: true },
    });
    if (!post) throw new NotFoundException(`Postulación #${id} no encontrada`);

    if (user.rol === Rol.EMPRESA) {
      await this.assertEmpresaOwnsOferta(post.ofertaId, user.id);
    }

    return this.prisma.postulacion.update({ where: { id }, data: { estado } });
  }
}
