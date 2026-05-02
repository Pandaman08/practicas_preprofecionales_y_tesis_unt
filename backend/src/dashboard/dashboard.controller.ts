import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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
}
