import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { AsesoresModule } from './asesores/asesores.module';
import { EmpresasModule } from './empresas/empresas.module';
import { OfertasModule } from './ofertas/ofertas.module';
import { TesisModule } from './tesis/tesis.module';
import { SeguimientoModule } from './seguimiento/seguimiento.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    EstudiantesModule,
    AsesoresModule,
    EmpresasModule,
    OfertasModule,
    TesisModule,
    SeguimientoModule,
    DashboardModule,
    ReportesModule,
  ],
})
export class AppModule {}
