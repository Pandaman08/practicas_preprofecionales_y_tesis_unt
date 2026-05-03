'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Clock, Building2, User, Calendar } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Practica } from '@/lib/types';
import Header from '@/components/layouts/Header';
import { formatDate } from '@/lib/utils/formatDate';

export default function PracticaDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: practica, isLoading } = useQuery({
    queryKey: ['practica', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Practica }>(
        ENDPOINTS.PRACTICAS.BY_ID(id)
      );
      return data.data;
    },
    enabled: !!id,
  });

  const totalHoras = practica?.horasTotales ?? 0;
  const horasEjec = (practica?.seguimientos ?? []).reduce((acc, s) => acc + (s.horasEjecutadas ?? 0), 0);
  const porcentaje = totalHoras > 0 ? Math.min((horasEjec / totalHoras) * 100, 100) : 0;

  if (isLoading) {
    return (
      <>
        <Header title="Detalle de Práctica" />
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </>
    );
  }

  if (!practica) {
    return (
      <>
        <Header title="Detalle de Práctica" />
        <div className="p-6 text-center text-gray-500">Práctica no encontrada</div>
      </>
    );
  }

  return (
    <>
      <Header title="Detalle de Práctica" />
      <div className="p-6 space-y-6">
        <Link href="/practicas" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" /> Volver a prácticas
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info principal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Información General</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Estudiante</p>
                    <p className="font-medium">
                      {practica.estudiante?.nombres} {practica.estudiante?.apellidos}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Empresa</p>
                    <p className="font-medium">{practica.empresa?.razonSocial}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Inicio</p>
                    <p className="font-medium">{formatDate(practica.fechaInicio)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Fin</p>
                    <p className="font-medium">{formatDate(practica.fechaFin)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seguimientos */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Seguimientos</h3>
              {practica.seguimientos && practica.seguimientos.length > 0 ? (
                <div className="space-y-3">
                  {practica.seguimientos.map((seg) => (
                    <div key={seg.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">{formatDate(seg.fecha)}</p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {seg.horasEjecutadas}h
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{seg.actividades}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Sin seguimientos registrados</p>
              )}
            </div>
          </div>

          {/* Progreso */}
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Progreso de Horas</h3>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{horasEjec}</p>
                <p className="text-gray-500 text-sm">de {totalHoras} horas</p>
              </div>
              <div className="mt-4 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {Math.round(porcentaje)}% completado
              </p>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Estado</h3>
              <span className={`badge-${practica.estado === 'EN_CURSO' || practica.estado === 'COMPLETADA' ? 'activo' : practica.estado === 'PENDIENTE' ? 'pendiente' : 'inactivo'}`}>
                {practica.estado === 'EN_CURSO' ? 'En curso' : practica.estado === 'COMPLETADA' ? 'Completada' : practica.estado === 'PENDIENTE' ? 'Pendiente' : 'Cancelada'}
              </span>
              {practica.observaciones && (
                <p className="text-sm text-gray-600 mt-3">{practica.observaciones}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
