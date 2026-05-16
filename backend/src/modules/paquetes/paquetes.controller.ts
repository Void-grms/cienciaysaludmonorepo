import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { PaquetesService } from './paquetes.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@Roles(Rol.ADMINISTRADOR)
@Controller('paquetes')
export class PaquetesController {
  constructor(private readonly paquetesService: PaquetesService) {}

  @Post()
  create(@Body() createPaqueteDto: any) {
    return this.paquetesService.create(createPaqueteDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.paquetesService.findAll(+page, +limit, search);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.paquetesService.delete(id);
  }
}
