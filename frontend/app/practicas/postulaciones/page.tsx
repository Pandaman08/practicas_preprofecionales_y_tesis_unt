'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react';
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

const TAB_ALL = 'TODAS';
type TabEstado = EstadoPostulacion | typeof TAB_ALL;
const PAGE_SIZE = 12;

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
  const [tabEstado, setTabEstado] = useState<TabEstado>(EstadoPostulacion.ACEPTADA);
  const [empresaFiltro, setEmpresaFiltro] = useState('');
  const [page, setPage] = useState(1);
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
        { params: { limit: 200 } },
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

  // Empresas únicas para select
  const empresasUnicas = useMemo(() => {
    const all = todasPostulaciones ?? [];
    const nombres = Array.from(new Set(all.map((p) => (p.oferta as any)?.empresa?.razonSocial).filter(Boolean))) as string[];
    return nombres.sort((a, b) => a.localeCompare(b));
  }, [todasPostulaciones]);

  // Contadores por estado (sin filtros de texto para mostrar totales reales)
  const contadores = useMemo(() => {
    const all = todasPostulaciones ?? [];
    return {
      TODAS: all.length,
      ACEPTADA: all.filter((p) => p.estado === EstadoPostulacion.ACEPTADA).length,
      PENDIENTE: all.filter((p) => p.estado === EstadoPostulacion.PENDIENTE).length,
      RECHAZADA: all.filter((p) => p.estado === EstadoPostulacion.RECHAZADA).length,
    };
  }, [todasPostulaciones]);

  const filtered = useMemo(() => {
    let all = todasPostulaciones ?? [];
    if (tabEstado !== TAB_ALL) {
      all = all.filter((p) => p.estado === tabEstado);
    }
    if (empresaFiltro) {
      all = all.filter((p) => (p.oferta as any)?.empresa?.razonSocial === empresaFiltro);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter(
        (p) =>
          `${p.estudiante?.nombres} ${p.estudiante?.apellidos}`.toLowerCase().includes(q) ||
          p.oferta?.titulo?.toLowerCase().includes(q),
      );
    }
    return all;
  }, [todasPostulaciones, tabEstado, empresaFiltro, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const resetPage = () => setPage(1);

  const tabs: { key: TabEstado; label: string; color: string }[] = [
    { key: TAB_ALL,     label: 'Todas',      color: 'bg-slate-100 text-slate-700' },
    { key: 'ACEPTADA',  label: 'Aceptadas',  color: 'bg-emerald-100 text-emerald-700' },
    { key: 'PENDIENTE', label: 'Pendientes', color: 'bg-amber-100 text-amber-700' },
    { key: 'RECHAZADA', label: 'Rechazadas', color: 'bg-red-100 text-red-700' },
  ];

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

      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* ── Tabs de estado ── */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const count = contadores[t.key === TAB_ALL ? 'TODAS' : t.key];
            const active = tabEstado === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setTabEstado(t.key); resetPage(); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  active
                    ? `${t.color} ring-2 ring-offset-1 ring-current`
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.label}
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${active ? 'bg-white/60' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Filtros búsqueda + empresa ── */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar estudiante u oferta..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={empresaFiltro}
            onChange={(e) => { setEmpresaFiltro(e.target.value); resetPage(); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
          >
            <option value="">Todas las empresas</option>
            {empresasUnicas.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          {(search || empresaFiltro) && (
            <button
              onClick={() => { setSearch(''); setEmpresaFiltro(''); resetPage(); }}
              className="text-xs text-slate-500 hover:text-slate-800 underline self-center"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ── Resultados ── */}
        {isLoading && (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Cargando postulaciones...</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="flex items-center justify-center h-40 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-sm">
            No hay postulaciones que coincidan con los filtros aplicados.
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <>
            <p className="text-xs text-slate-500">
              Mostrando {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length} postulaciones
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((p) => {
                const yaFormalizada = !!p.practica;
                return (
                  <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {p.estudiante?.nombres} {p.estudiante?.apellidos}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{p.oferta?.titulo}</p>
                        <p className="text-xs text-slate-400 truncate">{(p.oferta as any)?.empresa?.razonSocial}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(p.fechaPostulacion)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`badge ${estadoColors[p.estado]}`}>{estadoLabels[p.estado]}</span>
                        {p.archivoCv && (
                          <a
                            href={p.archivoCv}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> CV
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
                          Práctica creada
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
              })}
            </div>

            {/* ── Paginación ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">Página {safePage} de {totalPages}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                    .reduce<(number | '...')[]>((acc, n, idx, arr) => {
                      const prev = arr[idx - 1];
                      if (idx > 0 && typeof prev === 'number' && n - prev > 1) acc.push('...');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n) =>
                      n === '...' ? (
                        <span key={`ellipsis-${n}`} className="px-2 text-slate-400 text-sm">…</span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                            safePage === n
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {n}
                        </button>
                      ),
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Formalizar práctica ── */}
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
              <p className="font-semibold text-blue-800">
                {selectedPost.estudiante?.nombres} {selectedPost.estudiante?.apellidos}
              </p>
              <p className="text-blue-600">
                {selectedPost.oferta?.titulo} · {(selectedPost.oferta as any)?.empresa?.razonSocial}
              </p>
            </div>
            <div>
              <label htmlFor="prac-titulo" className="block text-sm font-medium text-slate-700 mb-1">
                Título de la práctica <span className="text-red-500">*</span>
              </label>
              <input
                id="prac-titulo"
                className="input-field"
                value={practicaForm.titulo}
                onChange={(e) => setPracticaForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prac-inicio" className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha inicio <span className="text-red-500">*</span>
                </label>
                <input
                  id="prac-inicio"
                  type="date"
                  className="input-field"
                  value={practicaForm.fechaInicio}
                  onChange={(e) => setPracticaForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="prac-fin" className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha fin (estimada)
                </label>
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
