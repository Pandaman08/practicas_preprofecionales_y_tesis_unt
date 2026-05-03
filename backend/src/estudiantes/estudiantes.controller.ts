import { Controller, Get, Put, Post, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EstudiantesService } from './estudiantes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Rol } from '@prisma/client';

@ApiTags('Estudiantes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('estudiantes')
export class EstudiantesController {
  constructor(private service: EstudiantesService) {}

  @Get()
  @Roles(Rol.ADMIN, Rol.COORDINADOR, Rol.ASESOR, Rol.EMPRESA)
  @ApiOperation({ summary: 'Listar estudiantes' })
  findAll(
    @CurrentUser() user: any,
    @Query('especialidad') especialidad?: string,
    @Query('ciclo') ciclo?: string,
    @Query('activo') activo?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      especialidad,
      ciclo: ciclo ? +ciclo : undefined,
      activo: activo !== undefined ? activo === 'true' : undefined,
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    }, user);
  }

  @Get('mi-perfil')
  @Roles(Rol.ESTUDIANTE)
  @ApiOperation({ summary: 'Ver mi perfil de estudiante' })
  miPerfil(@CurrentUser() user: any) {
    return this.service.findByUsuario(user.id);
  }

  @Get(':id')
  @Roles(Rol.ADMIN, Rol.COORDINADOR, Rol.ASESOR, Rol.EMPRESA)
  @ApiOperation({ summary: 'Ver detalle de estudiante' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Crear estudiante (solo ADMIN)' })
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put('mi-perfil')
  @Roles(Rol.ESTUDIANTE)
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  updateMiPerfil(@CurrentUser() user: any, @Body() body: any) {
    return this.service.updateByUsuario(user.id, body);
  }

  @Put(':id')
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Actualizar estudiante (solo ADMIN)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }
}
