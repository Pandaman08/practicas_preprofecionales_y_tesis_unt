import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { Response } from 'express';

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

  @Get('practicas/download')
  @ApiOperation({ summary: 'Descargar reporte de prácticas (CSV)' })
  async descargarPracticasCsv(
    @Res() res: Response,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('estado') estado?: string,
  ) {
    const csv = await this.service.exportPracticasCsv({
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
      estado,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_practicas_${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('tesis/download')
  @ApiOperation({ summary: 'Descargar reporte de tesis (CSV)' })
  async descargarTesisCsv(
    @Res() res: Response,
    @Query('estado') estado?: string,
    @Query('tipo') tipo?: string,
  ) {
    const csv = await this.service.exportTesisCsv({ estado, tipo });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_tesis_${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('empresas/download')
  @ApiOperation({ summary: 'Descargar reporte de empresas (CSV)' })
  async descargarEmpresasCsv(@Res() res: Response) {
    const csv = await this.service.exportEmpresasCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_empresas_${Date.now()}.csv"`);
    res.send(csv);
  }
}
