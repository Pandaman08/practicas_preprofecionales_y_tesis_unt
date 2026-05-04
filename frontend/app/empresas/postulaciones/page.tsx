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

const estadoOrder: Record<EstadoPostulacion, number> = {
  PENDIENTE: 0,
  ACEPTADA: 1,
  RECHAZADA: 2,
};

type PostulacionConOferta = Postulacion & {
  oferta: { id: number; titulo: string; modalidad: string };
};

type GrupoOferta = {
  ofertaId: number;
  ofertaTitulo: string;
  modalidad: string;
  items: PostulacionConOferta[];
  resumen: Record<EstadoPostulacion, number>;
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
    const map = new Map<number, GrupoOferta>();
    for (const p of rows) {
      const key = p.oferta?.id;
      if (!map.has(key)) {
        map.set(key, {
          ofertaId: key,
          ofertaTitulo: p.oferta?.titulo ?? '—',
          modalidad: p.oferta?.modalidad ?? '',
          items: [],
          resumen: {
            PENDIENTE: 0,
            ACEPTADA: 0,
            RECHAZADA: 0,
          },
        });
      }
      const group = map.get(key)!;
      group.items.push(p);
      group.resumen[p.estado] += 1;
    }
    return Array.from(map.values()).map((group) => ({
      ...group,
      items: [...group.items].sort((left, right) => {
        const byState = estadoOrder[left.estado] - estadoOrder[right.estado];
        if (byState !== 0) return byState;
        return new Date(right.fechaPostulacion).getTime() - new Date(left.fechaPostulacion).getTime();
      }),
    }));
  }, [rows]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Postulaciones recibidas"
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
        ) : grouped.length === 0 ? (
          <div className="flex items-center justify-center h-40 rounded-2xl border border-slate-200 bg-white text-slate-400 text-sm">
            No hay resultados para la búsqueda aplicada.
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((grupo) => (
              <div key={grupo.ofertaId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800">{grupo.ofertaTitulo}</h3>
                  <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-slate-500">
                      {grupo.modalidad} · {grupo.items.length} postulación{grupo.items.length !== 1 ? 'es' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                        Pendientes: {grupo.resumen.PENDIENTE}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                        Aceptadas: {grupo.resumen.ACEPTADA}
                      </span>
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                        Rechazadas: {grupo.resumen.RECHAZADA}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {grupo.items.map((p) => (
                    <div key={p.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {p.estudiante?.nombres} {p.estudiante?.apellidos}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Código: {p.estudiante?.codigo} · Postuló el {formatDate(p.fechaPostulacion)}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-2 lg:items-end">
                        <span className={`badge ${estadoColors[p.estado]}`}>
                          Estado: {estadoLabels[p.estado]}
                        </span>
                        {p.estado === EstadoPostulacion.PENDIENTE ? (
                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            <button
                              onClick={() => estadoMutation.mutate({ postId: p.id, estado: EstadoPostulacion.ACEPTADA })}
                              disabled={estadoMutation.isPending}
                              className="min-w-24 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-60"
                            >
                              Aceptar
                            </button>
                            <button
                              onClick={() => estadoMutation.mutate({ postId: p.id, estado: EstadoPostulacion.RECHAZADA })}
                              disabled={estadoMutation.isPending}
                              className="min-w-24 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-60"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            {p.estado === EstadoPostulacion.ACEPTADA ? 'La postulación ya fue aprobada.' : 'La postulación fue descartada.'}
                          </p>
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
