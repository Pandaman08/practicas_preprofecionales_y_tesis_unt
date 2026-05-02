'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, BarChart3 } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import Header from '@/components/layouts/Header';

type ReportType = 'practicas' | 'tesis' | 'empresas';

export default function ReportesPage() {
  const [tipo, setTipo] = useState<ReportType>('practicas');

  const endpointMap: Record<ReportType, string> = {
    practicas: ENDPOINTS.REPORTES.PRACTICAS,
    tesis: ENDPOINTS.REPORTES.TESIS,
    empresas: ENDPOINTS.REPORTES.EMPRESAS,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['reporte', tipo],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: any }>(
        endpointMap[tipo]
      );
      return data.data;
    },
  });

  const tabs: { key: ReportType; label: string }[] = [
    { key: 'practicas', label: 'Prácticas' },
    { key: 'tesis', label: 'Tesis' },
    { key: 'empresas', label: 'Empresas' },
  ];

  return (
    <>
      <Header title="Reportes" />
      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTipo(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tipo === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Resumen por estado */}
            {data.resumenPorEstado && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Resumen por Estado</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(data.resumenPorEstado).map(([estado, count]: any) => (
                    <div key={estado} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{count}</p>
                      <p className="text-xs text-gray-500 mt-1">{estado}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de items */}
            {Array.isArray(data.data) && data.data.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">
                    {data.total} registros encontrados
                  </h3>
                </div>
                <div className="overflow-auto">
                  <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                    {JSON.stringify(data.data.slice(0, 5), null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No hay datos disponibles</div>
        )}
      </div>
    </>
  );
}
