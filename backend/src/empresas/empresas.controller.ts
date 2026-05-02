import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import { ConveniosService } from './convenios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Rol } from '@prisma/client';

@ApiTags('Empresas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('empresas')
export class EmpresasController {
  constructor(
    private empresasService: EmpresasService,
    private conveniosService: ConveniosService,
  ) {}

  // --- Empresas ---
  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  findAll(
    @Query('sector') sector?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.empresasService.findAll({
      sector,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    });
  }

  @Get('mi-perfil')
  @Roles(Rol.EMPRESA)
  @ApiOperation({ summary: 'Ver mi perfil de empresa' })
  miPerfil(@CurrentUser() user: any) {
    return this.empresasService.findByUsuario(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de empresa' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empresasService.findOne(id);
  }

  @Put('mi-perfil')
  @Roles(Rol.EMPRESA)
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  updateMiPerfil(@CurrentUser() user: any, @Body() body: any) {
    return this.empresasService.updateByUsuario(user.id, body);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.COORDINADOR)
  @ApiOperation({ summary: 'Actualizar empresa' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.empresasService.update(id, body);
  }

  // --- Convenios ---
  @Get(':id/convenios')
  @ApiOperation({ summary: 'Ver convenios de una empresa' })
  getConvenios(@Param('id', ParseIntPipe) id: number) {
    return this.conveniosService.findAll({ empresaId: id });
  }

  @Post(':id/convenios')
  @Roles(Rol.ADMIN, Rol.COORDINADOR)
  @ApiOperation({ summary: 'Crear convenio para empresa' })
  createConvenio(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.conveniosService.create({ ...body, empresaId: id });
  }
}
