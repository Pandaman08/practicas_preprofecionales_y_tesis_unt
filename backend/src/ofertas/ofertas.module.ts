import { Module } from '@nestjs/common';
import { OfertasService } from './ofertas.service';
import { PostulacionesService } from './postulaciones.service';
import { OfertasController } from './ofertas.controller';

@Module({
  providers: [OfertasService, PostulacionesService],
  controllers: [OfertasController],
  exports: [OfertasService, PostulacionesService],
})
export class OfertasModule {}
