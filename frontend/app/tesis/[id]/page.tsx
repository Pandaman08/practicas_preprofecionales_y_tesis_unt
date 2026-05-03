'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, BookOpen, User, TrendingUp } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Tesis } from '@/lib/types';
import Header from '@/components/layouts/Header';
import { formatDate } from '@/lib/utils/formatDate';

export default function TesisDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: tesis, isLoading } = useQuery({
    queryKey: ['tesis', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Tesis }>(
        ENDPOINTS.TESIS.BY_ID(id)
      );
      return data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <>
        <Header title="Detalle de Tesis" />
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </>
    );
  }

  if (!tesis) {
    return (
      <>
        <Header title="Detalle de Tesis" />
        <div className="p-6 text-center text-gray-500">Tesis no encontrada</div>
      </>
    );
  }

  const lastAvance = tesis.avances?.[tesis.avances.length - 1];
  const progreso = lastAvance?.porcentaje ?? 0;

  return (
    <>
      <Header title="Detalle de Tesis" />
      <div className="p-6 space-y-6">
        <Link href="/tesis" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" /> Volver a tesis
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-start gap-3 mb-4">
                <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">{tesis.titulo}</h2>
                  <p className="text-sm text-gray-500 mt-1">{tesis.tipo === 'TESIS' ? 'Tesis' : tesis.tipo === 'TRABAJO_SUFICIENCIA' ? 'Trabajo de suficiencia' : 'Proyecto de investigacion'}</p>
                </div>
              </div>
              {tesis.resumen && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{tesis.resumen}</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Estudiante</p>
                    <p className="font-medium">
                      {tesis.estudiante?.usuario?.nombres} {tesis.estudiante?.usuario?.apellidos}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Asesor</p>
                    <p className="font-medium">
                      {tesis.asesor?.usuario?.nombres} {tesis.asesor?.usuario?.apellidos}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Avances */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Avances</h3>
              {tesis.avances && tesis.avances.length > 0 ? (
                <div className="space-y-3">
                  {tesis.avances.map((avance) => (
                    <div key={avance.id} className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-3">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">{formatDate(avance.fecha)}</p>
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          {avance.porcentaje}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{avance.descripcion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Sin avances registrados</p>
              )}
            </div>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Progreso</h3>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">{progreso}%</p>
              </div>
              <div className="mt-3 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Estado</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500">Estado actual</p>
                  <p className="font-medium">{tesis.estado}</p>
                </div>
                <div>
                  <p className="text-gray-500">Inicio</p>
                  <p className="font-medium">{formatDate(tesis.fechaInicio)}</p>
                </div>
                {tesis.fechaSustentacion && (
                  <div>
                    <p className="text-gray-500">Sustentación</p>
                    <p className="font-medium">{formatDate(tesis.fechaSustentacion)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
