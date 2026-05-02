import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoPostulacion } from '@prisma/client';

@Injectable()
export class PostulacionesService {
  constructor(private prisma: PrismaService) {}

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

  async findByOferta(ofertaId: number) {
    return this.prisma.postulacion.findMany({
      where: { ofertaId },
      include: { estudiante: true },
      orderBy: { fechaPostulacion: 'asc' },
    });
  }

  async updateEstado(id: number, estado: EstadoPostulacion) {
    const post = await this.prisma.postulacion.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Postulación #${id} no encontrada`);
    return this.prisma.postulacion.update({ where: { id }, data: { estado } });
  }
}
