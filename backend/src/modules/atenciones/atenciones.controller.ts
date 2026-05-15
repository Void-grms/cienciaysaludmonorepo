import { Controller, Get, Post, Body, Param, Query, Request, Patch } from '@nestjs/common';
import { AtencionesService } from './atenciones.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
@Controller('atenciones')
export class AtencionesController {
  constructor(private readonly atencionesService: AtencionesService) {}

  @Post()
  create(@Body() createAtencionDto: any, @Request() req: any) {
    // req.user viene del JwtAuthGuard
    const idUsuario = req.user?.sub || '00000000-0000-0000-0000-000000000000';
    return this.atencionesService.create(createAtencionDto, idUsuario);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.atencionesService.findAll(+page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.atencionesService.findOne(id);
  }

  @Patch(':id/muestras/:id_muestra')
  updateMuestra(
    @Param('id') idAtencion: string,
    @Param('id_muestra') idMuestra: string,
    @Body('estado') estado: string,
  ) {
    return this.atencionesService.updateMuestra(idAtencion, idMuestra, estado);
  }

  @Patch(':id/resultados')
  ingresarResultados(
    @Param('id') idAtencion: string,
    @Body() resultadosDto: any,
  ) {
    return this.atencionesService.ingresarResultados(idAtencion, resultadosDto);
  }
}
