import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PruebasService } from './pruebas.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@Roles(Rol.ADMINISTRADOR)
@Controller('pruebas')
export class PruebasController {
  constructor(private readonly pruebasService: PruebasService) {}

  @Post()
  create(@Body() createPruebaDto: any) {
    return this.pruebasService.create(createPruebaDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ) {
    return this.pruebasService.findAll(+page, +limit, search);
  }
}
