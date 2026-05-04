'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, ExternalLink, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { EstadoPostulacion, Postulacion, Rol } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layouts/Header';
import Modal from '@/components/shared/Modal';
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

const emptyPracticaForm = {
  titulo: '',
  fechaInicio: '',
  fechaFin: '',
  horasTotales: 240,
  observaciones: '',
};

export default function PostulacionesCoordinadorPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canFormalize = user?.rol === Rol.ADMIN || user?.rol === Rol.COORDINADOR;

  const [search, setSearch] = useState('');
  const [formalizarOpen, setFormalizarOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Postulacion | null>(null);
  const [practicaForm, setPracticaForm] = useState(emptyPracticaForm);

  // Cargar TODAS las postulaciones de todas las empresas (solo para ADMIN/COORDINADOR)
  const { data: todasPostulaciones, isLoading } = useQuery({
    queryKey: ['todas-postulaciones'],
    queryFn: async () => {
      // Obtenemos todas las postulaciones de todas las ofertas listando ofertas primero
      const { data: ofertasRes } = await apiClient.get<{ success: boolean; data: any }>(
        ENDPOINTS.OFERTAS.BASE,
        { params: { limit: 200, activo: true } },
      );
      const ofertas: any[] = ofertasRes.data?.data ?? [];

      const resultados: Postulacion[] = [];
      await Promise.all(
        ofertas.map(async (oferta) => {
          try {
            const { data } = await apiClient.get<{ success: boolean; data: Postulacion[] }>(
              ENDPOINTS.OFERTAS.POSTULACIONES(oferta.id),
            );
            resultados.push(...(data.data ?? []).map((p) => ({ ...p, oferta })));
          } catch {
            // ignorar si falla alguna
          }
        }),
      );
      return resultados.sort(
        (a, b) => new Date(b.fechaPostulacion).getTime() - new Date(a.fechaPostulacion).getTime(),
      );
    },
    enabled: canFormalize,
  });

  const formalizarMutation = useMutation({
    mutationFn: async ({ postulacionId, data }: { postulacionId: number; data: typeof practicaForm }) => {
      await apiClient.post(ENDPOINTS.PRACTICAS.DESDE_POSTULACION(postulacionId), {
        ...data,
        horasTotales: Number(data.horasTotales),
        fechaFin: data.fechaFin || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Práctica formalizada correctamente');
      setFormalizarOpen(false);
      queryClient.invalidateQueries({ queryKey: ['todas-postulaciones'] });
      queryClient.invalidateQueries({ queryKey: ['practicas'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'No se pudo formalizar la práctica';
      toast.error(msg);
    },
  });

  const filtered = useMemo(() => {
    const all = todasPostulaciones ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (p) =>
        `${p.estudiante?.nombres} ${p.estudiante?.apellidos}`.toLowerCase().includes(q) ||
        p.oferta?.titulo?.toLowerCase().includes(q) ||
        (p.oferta as any)?.empresa?.razonSocial?.toLowerCase().includes(q),
    );
  }, [todasPostulaciones, search]);

  const aceptadas = useMemo(() => filtered.filter((p) => p.estado === EstadoPostulacion.ACEPTADA), [filtered]);
  const pendientes = useMemo(() => filtered.filter((p) => p.estado === EstadoPostulacion.PENDIENTE), [filtered]);
  const rechazadas = useMemo(() => filtered.filter((p) => p.estado === EstadoPostulacion.RECHAZADA), [filtered]);

  const renderCard = (p: Postulacion) => {
    const yaFormalizada = !!p.practica;
    return (
      <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {p.estudiante?.nombres} {p.estudiante?.apellidos}
            </p>
            <p className="text-xs text-slate-500">{p.oferta?.titulo}</p>
            <p className="text-xs text-slate-400">{(p.oferta as any)?.empresa?.razonSocial}</p>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(p.fechaPostulacion)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`badge ${estadoColors[p.estado]}`}>{estadoLabels[p.estado]}</span>
            {p.archivoCv && (
              <a
                href={p.archivoCv}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Ver CV
              </a>
            )}
          </div>
        </div>

        {p.estado === EstadoPostulacion.ACEPTADA && canFormalize && (
          yaFormalizada ? (
            <Link
              href={`/practicas/${p.practica!.id}`}
              className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 w-fit hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Práctica creada: {p.practica!.titulo}
            </Link>
          ) : (
            <button
              onClick={() => {
                setSelectedPost(p);
                setPracticaForm({ ...emptyPracticaForm, titulo: p.oferta?.titulo ?? '' });
                setFormalizarOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 w-fit transition-colors font-medium"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Formalizar práctica
            </button>
          )
        )}
      </div>
    );
  };

  if (!canFormalize) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header title="Postulaciones" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No tienes acceso a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Postulaciones — Todas las empresas" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por estudiante, oferta o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Cargando postulaciones...</div>
        ) : (
          <div className="space-y-6">
            {aceptadas.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="badge badge-activo">Aceptadas — {aceptadas.length}</span>
                  <span className="text-xs font-normal text-slate-500">Pendientes de formalizar</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {aceptadas.map(renderCard)}
                </div>
              </section>
            )}

            {pendientes.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-700 mb-3">
                  <span className="badge badge-pendiente">Pendientes — {pendientes.length}</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pendientes.map(renderCard)}
                </div>
              </section>
            )}

            {rechazadas.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-700 mb-3">
                  <span className="badge badge-inactivo">Rechazadas — {rechazadas.length}</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {rechazadas.map(renderCard)}
                </div>
              </section>
            )}

            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                No hay postulaciones que coincidan con la búsqueda.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Formalizar práctica */}
      <Modal
        open={formalizarOpen}
        onClose={() => setFormalizarOpen(false)}
        title="Formalizar práctica"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setFormalizarOpen(false)} className="btn-secondary">Cancelar</button>
            <button
              onClick={() => selectedPost && formalizarMutation.mutate({ postulacionId: selectedPost.id, data: practicaForm })}
              disabled={formalizarMutation.isPending || !practicaForm.titulo || !practicaForm.fechaInicio}
              className="btn-primary"
            >
              {formalizarMutation.isPending ? 'Creando...' : 'Crear práctica'}
            </button>
          </div>
        }
      >
        {selectedPost && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
              <p className="font-semibold text-blue-800">{selectedPost.estudiante?.nombres} {selectedPost.estudiante?.apellidos}</p>
              <p className="text-blue-600">{selectedPost.oferta?.titulo} · {(selectedPost.oferta as any)?.empresa?.razonSocial}</p>
            </div>
            <div>
              <label htmlFor="prac-titulo" className="block text-sm font-medium text-slate-700 mb-1">Título de la práctica <span className="text-red-500">*</span></label>
              <input
                id="prac-titulo"
                className="input-field"
                value={practicaForm.titulo}
                onChange={(e) => setPracticaForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prac-inicio" className="block text-sm font-medium text-slate-700 mb-1">Fecha inicio <span className="text-red-500">*</span></label>
                <input
                  id="prac-inicio"
                  type="date"
                  className="input-field"
                  value={practicaForm.fechaInicio}
                  onChange={(e) => setPracticaForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="prac-fin" className="block text-sm font-medium text-slate-700 mb-1">Fecha fin (estimada)</label>
                <input
                  id="prac-fin"
                  type="date"
                  className="input-field"
                  value={practicaForm.fechaFin}
                  onChange={(e) => setPracticaForm((f) => ({ ...f, fechaFin: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label htmlFor="prac-horas" className="block text-sm font-medium text-slate-700 mb-1">Horas totales</label>
              <input
                id="prac-horas"
                type="number"
                min={1}
                className="input-field"
                value={practicaForm.horasTotales}
                onChange={(e) => setPracticaForm((f) => ({ ...f, horasTotales: +e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="prac-obs" className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea
                id="prac-obs"
                className="input-field min-h-[80px]"
                value={practicaForm.observaciones}
                onChange={(e) => setPracticaForm((f) => ({ ...f, observaciones: e.target.value }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
