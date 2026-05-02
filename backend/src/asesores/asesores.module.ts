import { Module } from '@nestjs/common';
import { AsesoresService } from './asesores.service';
import { AsesoresController } from './asesores.controller';

@Module({
  providers: [AsesoresService],
  controllers: [AsesoresController],
  exports: [AsesoresService],
})
export class AsesoresModule {}
