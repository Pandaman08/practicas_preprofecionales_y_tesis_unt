import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SeguimientoService } from './seguimiento.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Rol, EstadoPractica } from '@prisma/client';

@ApiTags('Prácticas y Seguimiento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('practicas')
export class SeguimientoController {
  constructor(private service: SeguimientoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar prácticas' })
  findAll(
      @CurrentUser() user: any,
    @Query('estudianteId') estudianteId?: string,
    @Query('empresaId') empresaId?: string,
    @Query('asesorId') asesorId?: string,
    @Query('estado') estado?: EstadoPractica,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAllPracticas({
      currentUser: user,
      estudianteId: estudianteId ? +estudianteId : undefined,
      empresaId: empresaId ? +empresaId : undefined,
      asesorId: asesorId ? +asesorId : undefined,
      estado,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de práctica' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOnePractica(id);
  }

  @Post()
  @Roles(Rol.ADMIN, Rol.COORDINADOR, Rol.ASESOR)
  @ApiOperation({ summary: 'Registrar nueva práctica' })
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.service.createPractica(body, user);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.COORDINADOR, Rol.ASESOR)
  @ApiOperation({ summary: 'Actualizar práctica' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updatePractica(id, body);
  }

  @Get(':id/seguimientos')
  @ApiOperation({ summary: 'Ver seguimientos de una práctica' })
  getSeguimientos(@Param('id', ParseIntPipe) id: number) {
    return this.service.findSeguimientosByPractica(id);
  }

  @Post(':id/seguimientos')
  @Roles(Rol.ESTUDIANTE, Rol.ASESOR, Rol.ADMIN)
  @ApiOperation({ summary: 'Registrar seguimiento de práctica' })
  createSeguimiento(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.createSeguimiento(id, body);
  }

  @Put('seguimientos/:segId')
  @Roles(Rol.ESTUDIANTE, Rol.ASESOR, Rol.ADMIN)
  @ApiOperation({ summary: 'Actualizar seguimiento' })
  updateSeguimiento(@Param('segId', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateSeguimiento(id, body);
  }
}
