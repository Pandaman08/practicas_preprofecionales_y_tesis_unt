import { Controller, Get, Put, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
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
    @Query('especialidad') especialidad?: string,
    @Query('ciclo') ciclo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      especialidad,
      ciclo: ciclo ? +ciclo : undefined,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    });
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put('mi-perfil')
  @Roles(Rol.ESTUDIANTE)
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  updateMiPerfil(@CurrentUser() user: any, @Body() body: any) {
    return this.service.updateByUsuario(user.id, body);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.COORDINADOR)
  @ApiOperation({ summary: 'Actualizar estudiante' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }
}
