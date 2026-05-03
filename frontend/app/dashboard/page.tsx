'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layouts/Header';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
} from 'lucide-react';
import { DashboardResumen, KpiItem, Usuario } from '@/lib/types';

interface StatCardProps {
  item: KpiItem;
}

function getDisplayName(user: Usuario | null) {
  if (!user) return 'Usuario';
  if (user.perfil?.nombres || user.perfil?.apellidos) {
    return `${user.perfil?.nombres ?? ''} ${user.perfil?.apellidos ?? ''}`.trim();
  }
  return user.email;
}

function StatCard({ item }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-5 flex items-center gap-4 border">
      <div>
        <p className="text-2xl font-bold text-gray-900">
          {item.value}
        </p>
        <p className="text-sm text-gray-500">{item.label}</p>
        {item.hint && <p className="text-xs text-gray-400 mt-1">{item.hint}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: resumen, isLoading } = useQuery<DashboardResumen>({
    queryKey: ['dashboard-stats', user?.rol],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: DashboardResumen }>(
        ENDPOINTS.DASHBOARD.MI_RESUMEN
      );
      return data.data;
    },
  });

  const trend = resumen?.trend;
  const trendUp = !!trend && trend.delta > 0;
  const trendDown = !!trend && trend.delta < 0;

  return (
    <>
      <Header title="Dashboard" />

      <div className="p-6 space-y-8 bg-gray-50 min-h-screen">

        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Bienvenido, {getDisplayName(user)}
          </h2>
          <p className="text-sm text-gray-500">
            {resumen?.title || 'Resumen general del sistema'}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(resumen?.kpis ?? []).map((item) => (
              <StatCard key={item.key} item={item} />
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">
              Tendencia y alertas
            </h3>
          </div>

          {trend ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 bg-gray-50">
                <p className="text-sm text-gray-600">{trend.label}</p>
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-3xl font-bold text-gray-900">{trend.current}</p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      trendUp
                        ? 'bg-green-100 text-green-700'
                        : trendDown
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {trendUp && <ArrowUpRight className="h-3 w-3" />}
                    {trendDown && <ArrowDownRight className="h-3 w-3" />}
                    {!trendUp && !trendDown && <Equal className="h-3 w-3" />}
                    {trend.percent}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mes anterior: {trend.previous}</p>
              </div>

              <div className="rounded-xl border p-4 bg-gray-50 space-y-2">
                <p className="text-sm font-semibold text-gray-700">Highlights</p>
                {(resumen?.highlights ?? []).length ? (
                  (resumen?.highlights ?? []).map((h, index) => (
                    <p key={`${h}-${index}`} className="text-sm text-gray-600">• {h}</p>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Sin alertas destacadas en este periodo.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Sin tendencia disponible para este rol.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            {[
              { label: 'Prácticas', href: '/practicas', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
              { label: 'Tesis', href: '/tesis', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700' },
              { label: 'Empresas', href: '/empresas', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
              { label: 'Estudiantes', href: '/estudiantes', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-3 text-sm font-medium text-center transition ${item.color}`}
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