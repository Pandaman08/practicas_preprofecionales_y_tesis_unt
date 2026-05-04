'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText, ExternalLink } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { EstadoPostulacion, Postulacion } from '@/lib/types';
import Header from '@/components/layouts/Header';
import { formatDate } from '@/lib/utils/formatDate';

const estadoLabels: Record<EstadoPostulacion, string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
};

const estadoColors: Record<EstadoPostulacion, string> = {
  PENDIENTE: 'badge-pendiente',
  ACEPTADA: 'badge-activo',
  RECHAZADA: 'badge-inactivo',
};

export default function MisPostulacionesPage() {
  const { data: postulaciones, isLoading } = useQuery({
    queryKey: ['mis-solicitudes'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Postulacion[] }>(
        ENDPOINTS.OFERTAS.MIS_SOLICITUDES,
      );
      return data.data;
    },
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Mis postulaciones" />

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-slate-500 text-sm">Cargando tus postulaciones...</p>
          </div>
        ) : !postulaciones?.length ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
            <FileText className="h-10 w-10" />
            <p className="text-sm">Aún no has postulado a ninguna oferta.</p>
            <a href="/ofertas" className="text-sm text-blue-600 hover:underline">Explorar ofertas disponibles</a>
          </div>
        ) : (
          <div className="space-y-4">
            {postulaciones.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
              >
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{p.oferta?.titulo}</p>
                    <p className="text-sm text-slate-500">{p.oferta?.empresa?.razonSocial}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Postulado el {formatDate(p.fechaPostulacion)}</p>
                  </div>
                  <span className={`badge ${estadoColors[p.estado]}`}>
                    {estadoLabels[p.estado]}
                  </span>
                </div>

                {/* Detalle de estado */}
                {p.estado === EstadoPostulacion.ACEPTADA && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
                    {p.practica ? (
                      <p>
                        Tu práctica fue formalizada:{' '}
                        <a href={`/practicas/${p.practica.id}`} className="font-semibold underline hover:text-emerald-900">
                          {p.practica.titulo}
                        </a>
                      </p>
                    ) : (
                      <p>¡Felicidades! Tu postulación fue aceptada. El coordinador pronto formalizará tu práctica.</p>
                    )}
                  </div>
                )}

                {p.estado === EstadoPostulacion.RECHAZADA && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    Tu postulación no fue seleccionada en esta ocasión. Sigue explorando otras ofertas.
                  </div>
                )}

                {/* Adjuntos */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {p.archivoCv && (
                    <a
                      href={p.archivoCv}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver CV enviado
                    </a>
                  )}
                  {p.cartaMotivacion && (
                    <span className="text-slate-500 italic">&ldquo;{p.cartaMotivacion.slice(0, 120)}{p.cartaMotivacion.length > 120 ? '...' : ''}&rdquo;</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
