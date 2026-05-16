import { Module } from '@nestjs/common';
import { ReferenciasService } from './referencias.service';
import { ReferenciasController } from './referencias.controller';

@Module({
  controllers: [ReferenciasController],
  providers: [ReferenciasService],
  exports: [ReferenciasService]
})
export class ReferenciasModule {}
