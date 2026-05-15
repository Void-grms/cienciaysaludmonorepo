import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@Roles(Rol.ADMINISTRADOR)
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Post()
  create(@Body() createPacienteDto: any) {
    return this.pacientesService.create(createPacienteDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.pacientesService.findAll(+page, +limit, search);
  }

  @Get('buscar')
  buscarRapido(@Query('q') query: string) {
    if (!query || query.length < 3) return { data: [] };
    return this.pacientesService.findAll(1, 5, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pacientesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePacienteDto: any) {
    return this.pacientesService.update(id, updatePacienteDto);
  }
}
