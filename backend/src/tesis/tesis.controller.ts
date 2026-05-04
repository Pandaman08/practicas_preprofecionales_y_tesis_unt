import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TesisService } from './tesis.service';
import { AvancesService } from './avances.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Rol, EstadoTesis } from '@prisma/client';

@ApiTags('Tesis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tesis')
export class TesisController {
  constructor(
    private tesisService: TesisService,
    private avancesService: AvancesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar tesis' })
  findAll(
    @CurrentUser() user: any,
    @Query('estudianteId') estudianteId?: string,
    @Query('asesorId') asesorId?: string,
    @Query('estado') estado?: EstadoTesis,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tesisService.findAll({
      currentUser: user,
      estudianteId: estudianteId ? +estudianteId : undefined,
      asesorId: asesorId ? +asesorId : undefined,
      estado,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de tesis' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.tesisService.findOne(id, user);
  }

  @Post()
  @Roles(Rol.ESTUDIANTE, Rol.ADMIN, Rol.COORDINADOR)
  @ApiOperation({ summary: 'Registrar nueva tesis' })
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.tesisService.create(body, user);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.COORDINADOR, Rol.ASESOR, Rol.ESTUDIANTE)
  @ApiOperation({ summary: 'Actualizar tesis' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @CurrentUser() user: any) {
    return this.tesisService.update(id, body, user);
  }

  // --- Avances ---
  @Get(':id/avances')
  @ApiOperation({ summary: 'Ver avances de una tesis' })
  getAvances(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.avancesService.findByTesis(id, user);
  }

  @Post(':id/avances')
  @Roles(Rol.ESTUDIANTE, Rol.ASESOR, Rol.ADMIN)
  @ApiOperation({ summary: 'Registrar avance de tesis' })
  createAvance(@Param('id', ParseIntPipe) id: number, @Body() body: any, @CurrentUser() user: any) {
    return this.avancesService.create(id, body, user);
  }

  @Put('avances/:avanceId')
  @Roles(Rol.ESTUDIANTE, Rol.ASESOR, Rol.ADMIN)
  @ApiOperation({ summary: 'Actualizar avance' })
  updateAvance(@Param('avanceId', ParseIntPipe) id: number, @Body() body: any, @CurrentUser() user: any) {
    return this.avancesService.update(id, body, user);
  }

  @Delete('avances/:avanceId')
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Eliminar avance (solo ADMIN)' })
  removeAvance(@Param('avanceId', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.avancesService.remove(id, user);
  }
}
