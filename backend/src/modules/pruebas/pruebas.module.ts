import { Module } from '@nestjs/common';
import { PruebasService } from './pruebas.service';
import { PruebasController } from './pruebas.controller';

@Module({
  controllers: [PruebasController],
  providers: [PruebasService],
  exports: [PruebasService]
})
export class PruebasModule {}
