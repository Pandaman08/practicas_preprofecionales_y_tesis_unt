import { Controller, Get, Put, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AsesoresService } from './asesores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Rol } from '@prisma/client';

@ApiTags('Asesores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('asesores')
export class AsesoresController {
  constructor(private service: AsesoresService) {}

  @Get()
  @Roles(Rol.ADMIN, Rol.COORDINADOR, Rol.ESTUDIANTE)
  @ApiOperation({ summary: 'Listar asesores' })
  findAll(
    @Query('especialidad') especialidad?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      especialidad,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    });
  }

  @Get('mi-perfil')
  @Roles(Rol.ASESOR)
  @ApiOperation({ summary: 'Ver mi perfil de asesor' })
  miPerfil(@CurrentUser() user: any) {
    return this.service.findByUsuario(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de asesor' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put('mi-perfil')
  @Roles(Rol.ASESOR)
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  updateMiPerfil(@CurrentUser() user: any, @Body() body: any) {
    return this.service.updateByUsuario(user.id, body);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.COORDINADOR)
  @ApiOperation({ summary: 'Actualizar asesor' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }
}
