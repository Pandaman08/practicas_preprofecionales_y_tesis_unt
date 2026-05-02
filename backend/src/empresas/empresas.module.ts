import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { ConveniosService } from './convenios.service';
import { EmpresasController } from './empresas.controller';

@Module({
  providers: [EmpresasService, ConveniosService],
  controllers: [EmpresasController],
  exports: [EmpresasService, ConveniosService],
})
export class EmpresasModule {}
