'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
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

type PostulacionConOferta = Postulacion & {
  oferta: { id: number; titulo: string; modalidad: string };
};

export default function EmpresaPostulacionesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: postulaciones, isLoading } = useQuery({
    queryKey: ['mis-postulaciones-empresa'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PostulacionConOferta[] }>(
        ENDPOINTS.OFERTAS.MIS_POSTULACIONES,
      );
      return data.data;
    },
  });

  const estadoMutation = useMutation({
    mutationFn: async ({ postId, estado }: { postId: number; estado: EstadoPostulacion }) => {
      await apiClient.put(ENDPOINTS.OFERTAS.ESTADO_POSTULACION(postId), { estado });
    },
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['mis-postulaciones-empresa'] });
    },
    onError: () => toast.error('No se pudo actualizar el estado'),
  });

  const rows = useMemo(() => {
    if (!postulaciones) return [];
    if (!search.trim()) return postulaciones;
    const q = search.toLowerCase();
    return postulaciones.filter(
      (p) =>
        `${p.estudiante?.nombres} ${p.estudiante?.apellidos}`.toLowerCase().includes(q) ||
        p.oferta?.titulo?.toLowerCase().includes(q),
    );
  }, [postulaciones, search]);

  // Agrupar por oferta para presentación más clara
  const grouped = useMemo(() => {
    const map = new Map<number, { ofertaTitulo: string; modalidad: string; items: PostulacionConOferta[] }>();
    for (const p of rows) {
      const key = p.oferta?.id;
      if (!map.has(key)) {
        map.set(key, { ofertaTitulo: p.oferta?.titulo ?? '—', modalidad: p.oferta?.modalidad ?? '', items: [] });
      }
      map.get(key)!.items.push(p);
    }
    return Array.from(map.entries());
  }, [rows]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Postulaciones recibidas"
        subtitle="Candidatos que han aplicado a tus ofertas de práctica"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Buscador */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por estudiante u oferta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Cargando...</div>
        ) : !postulaciones?.length ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            No hay postulaciones recibidas aún.
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([ofertaId, grupo]) => (
              <div key={ofertaId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800">{grupo.ofertaTitulo}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{grupo.modalidad} · {grupo.items.length} postulación{grupo.items.length !== 1 ? 'es' : ''}</p>
                </div>

                <div className="divide-y divide-slate-100">
                  {grupo.items.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {p.estudiante?.nombres} {p.estudiante?.apellidos}
                        </p>
                        <p className="text-xs text-slate-500">
                          Código: {p.estudiante?.codigo} · {formatDate(p.fechaPostulacion)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`badge ${estadoColors[p.estado]}`}>
                          {estadoLabels[p.estado]}
                        </span>
                        {p.estado === EstadoPostulacion.PENDIENTE && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => estadoMutation.mutate({ postId: p.id, estado: EstadoPostulacion.ACEPTADA })}
                              disabled={estadoMutation.isPending}
                              className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-60"
                            >
                              Aceptar
                            </button>
                            <button
                              onClick={() => estadoMutation.mutate({ postId: p.id, estado: EstadoPostulacion.RECHAZADA })}
                              disabled={estadoMutation.isPending}
                              className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-60"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
