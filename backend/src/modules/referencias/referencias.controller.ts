import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ReferenciasService } from './referencias.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@Roles(Rol.ADMINISTRADOR)
@Controller('referencias')
export class ReferenciasController {
  constructor(private readonly referenciasService: ReferenciasService) {}

  @Post()
  create(@Body() createReferenciaDto: any) {
    return this.referenciasService.create(createReferenciaDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.referenciasService.findAll(+page, +limit, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.referenciasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReferenciaDto: any) {
    return this.referenciasService.update(id, updateReferenciaDto);
  }

  @Post(':id/medicos')
  addMedico(@Param('id') id: string, @Body() createMedicoDto: any) {
    return this.referenciasService.addMedico(id, createMedicoDto);
  }
}
