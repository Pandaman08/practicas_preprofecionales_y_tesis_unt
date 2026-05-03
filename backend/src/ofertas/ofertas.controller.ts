import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OfertasService } from './ofertas.service';
import { PostulacionesService } from './postulaciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Rol } from '@prisma/client';

@ApiTags('Ofertas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ofertas')
export class OfertasController {
  constructor(
    private ofertasService: OfertasService,
    private postulacionesService: PostulacionesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar ofertas activas' })
  findAll(
    @CurrentUser() user: any,
    @Query('empresaId') empresaId?: string,
    @Query('activo') activo?: string,
    @Query('modalidad') modalidad?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ofertasService.findAll({
      empresaId: empresaId ? +empresaId : undefined,
      activo: activo !== undefined ? activo === 'true' : (user?.rol === Rol.EMPRESA ? undefined : true),
      modalidad,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    }, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de oferta' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ofertasService.findOne(id);
  }

  @Post()
  @Roles(Rol.EMPRESA, Rol.ADMIN)
  @ApiOperation({ summary: 'Crear nueva oferta' })
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.ofertasService.create(body, user);
  }

  @Put(':id')
  @Roles(Rol.EMPRESA, Rol.ADMIN)
  @ApiOperation({ summary: 'Actualizar oferta' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @CurrentUser() user: any) {
    return this.ofertasService.update(id, body, user);
  }

  @Delete(':id')
  @Roles(Rol.EMPRESA, Rol.ADMIN)
  @ApiOperation({ summary: 'Desactivar oferta' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.ofertasService.remove(id, user);
  }

  // --- Postulaciones ---
  @Post(':id/postular')
  @Roles(Rol.ESTUDIANTE)
  @ApiOperation({ summary: 'Postular a una oferta' })
  async postular(
    @Param('id', ParseIntPipe) ofertaId: number,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const estudianteId = await this.postulacionesService.getEstudianteIdByUsuario(user.id);
    return this.postulacionesService.postular(estudianteId, ofertaId, body.cartaMotivacion);
  }

  @Get(':id/postulaciones')
  @Roles(Rol.EMPRESA, Rol.ADMIN, Rol.COORDINADOR)
  @ApiOperation({ summary: 'Ver postulaciones de una oferta' })
  getPostulaciones(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.postulacionesService.findByOferta(id, user);
  }

  @Put('postulaciones/:postId/estado')
  @Roles(Rol.EMPRESA, Rol.ADMIN, Rol.COORDINADOR)
  @ApiOperation({ summary: 'Actualizar estado de postulación' })
  updateEstado(@Param('postId', ParseIntPipe) id: number, @Body('estado') estado: any, @CurrentUser() user: any) {
    return this.postulacionesService.updateEstado(id, estado, user);
  }
}
