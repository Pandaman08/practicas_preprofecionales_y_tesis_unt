'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layouts/Header';
import {
  Users, Building2, Briefcase, GraduationCap,
  FileText, TrendingUp, CheckCircle, Clock,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`${bgColor} p-3 rounded-lg`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '-'}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: any }>(
        ENDPOINTS.DASHBOARD.MI_RESUMEN
      );
      return data.data;
    },
  });

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">
            Buenos días, {user?.nombres} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Resumen del sistema de prácticas y tesis UNT
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-24 bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats?.estudiantes !== undefined && (
              <StatCard title="Estudiantes" value={stats.estudiantes} icon={Users} color="text-blue-600" bgColor="bg-blue-100" />
            )}
            {stats?.asesores !== undefined && (
              <StatCard title="Asesores" value={stats.asesores} icon={Users} color="text-purple-600" bgColor="bg-purple-100" />
            )}
            {stats?.empresas !== undefined && (
              <StatCard title="Empresas" value={stats.empresas} icon={Building2} color="text-green-600" bgColor="bg-green-100" />
            )}
            {stats?.practicasActivas !== undefined && (
              <StatCard title="Prácticas Activas" value={stats.practicasActivas} icon={Briefcase} color="text-orange-600" bgColor="bg-orange-100" />
            )}
            {stats?.tesisEnProceso !== undefined && (
              <StatCard title="Tesis en Proceso" value={stats.tesisEnProceso} icon={GraduationCap} color="text-indigo-600" bgColor="bg-indigo-100" />
            )}
            {stats?.ofertasActivas !== undefined && (
              <StatCard title="Ofertas Activas" value={stats.ofertasActivas} icon={FileText} color="text-cyan-600" bgColor="bg-cyan-100" />
            )}
            {stats?.practicasCompletadas !== undefined && (
              <StatCard title="Prácticas Completadas" value={stats.practicasCompletadas} icon={CheckCircle} color="text-emerald-600" bgColor="bg-emerald-100" />
            )}
            {stats?.postulacionesPendientes !== undefined && (
              <StatCard title="Postulaciones Pendientes" value={stats.postulacionesPendientes} icon={Clock} color="text-yellow-600" bgColor="bg-yellow-100" />
            )}
          </div>
        )}

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Accesos rápidos</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Ver Prácticas', href: '/practicas', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
              { label: 'Ver Tesis', href: '/tesis', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700' },
              { label: 'Empresas', href: '/empresas', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
              { label: 'Estudiantes', href: '/estudiantes', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`${item.color} px-4 py-3 rounded-lg text-sm font-medium text-center transition-colors`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
