import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@Roles(Rol.ADMINISTRADOR)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(@Body() createUsuarioDto: any) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.usuariosService.findAll(+page, +limit, search);
  }

  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body('estado') estado: string) {
    return this.usuariosService.updateEstado(id, estado);
  }

  @Patch(':id/permisos')
  setPermisos(@Param('id') id: string, @Body() permisosDto: any) {
    return this.usuariosService.setPermisos(id, permisosDto);
  }
}
