import { Controller, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Rol } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas generales' })
  getStats() {
    return this.service.getStats();
  }

  @Get('mi-resumen')
  @ApiOperation({ summary: 'Obtener resumen según rol del usuario' })
  getMiResumen(@CurrentUser() user: any) {
    return this.service.getStatsByUser(user.id, user.rol);
  }

  @Get('admin-analytics')
  @ApiOperation({ summary: 'Obtener analitica avanzada para admin' })
  getAdminAnalytics(
    @CurrentUser() user: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('especialidad') especialidad?: string,
    @Query('estado') estado?: string,
  ) {
    if (user.rol !== Rol.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede acceder a esta analitica');
    }

    return this.service.getAdminAnalytics({
      month: month ? +month : undefined,
      year: year ? +year : undefined,
      especialidad,
      estado,
    });
  }
}
