import { Module } from '@nestjs/common';
import { TesisService } from './tesis.service';
import { AvancesService } from './avances.service';
import { TesisController } from './tesis.controller';

@Module({
  providers: [TesisService, AvancesService],
  controllers: [TesisController],
  exports: [TesisService, AvancesService],
})
export class TesisModule {}
