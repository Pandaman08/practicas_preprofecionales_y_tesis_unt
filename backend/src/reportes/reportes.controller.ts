import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN, Rol.COORDINADOR)
@Controller('reportes')
export class ReportesController {
  constructor(private service: ReportesService) {}

  @Get('practicas')
  @ApiOperation({ summary: 'Reporte de prácticas' })
  reportePracticas(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('estado') estado?: string,
  ) {
    return this.service.reportePracticas({
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
      estado,
    });
  }

  @Get('tesis')
  @ApiOperation({ summary: 'Reporte de tesis' })
  reporteTesis(
    @Query('estado') estado?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.service.reporteTesis({ estado, tipo });
  }

  @Get('empresas')
  @ApiOperation({ summary: 'Reporte de empresas' })
  reporteEmpresas() {
    return this.service.reporteEmpresas();
  }
}
