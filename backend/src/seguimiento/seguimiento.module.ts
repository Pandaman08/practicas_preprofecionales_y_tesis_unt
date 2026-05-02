import { Module } from '@nestjs/common';
import { SeguimientoService } from './seguimiento.service';
import { SeguimientoController } from './seguimiento.controller';

@Module({
  providers: [SeguimientoService],
  controllers: [SeguimientoController],
  exports: [SeguimientoService],
})
export class SeguimientoModule {}
