'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Eye, Pencil, Plus, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { EstadoPostulacion, Oferta, PaginatedResponse, Postulacion, Rol } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layouts/Header';
import DataTable, { Column } from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import { formatDate } from '@/lib/utils/formatDate';

const estadoPostulacionLabels: Record<EstadoPostulacion, string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
};

const estadoPostulacionColors: Record<EstadoPostulacion, string> = {
  PENDIENTE: 'badge-pendiente',
  ACEPTADA: 'badge-activo',
  RECHAZADA: 'badge-inactivo',
};

const emptyForm = {
  titulo: '',
  descripcion: '',
  requisitos: '',
  modalidad: 'PRESENCIAL',
  remuneracion: '',
  vacantes: 1,
  fechaLimite: '',
  activo: true,
};

export default function OfertasPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEmpresa = user?.rol === Rol.EMPRESA;
  const isAdmin = user?.rol === Rol.ADMIN || user?.rol === Rol.COORDINADOR;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [postulacionesOpen, setPostulacionesOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Oferta | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ofertas', page, user?.rol],
    queryFn: async () => {
      const params: any = { page, limit: 10 };
      if (!isEmpresa) params.activo = true;
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Oferta & { _count?: { postulaciones: number } }> }>(
        ENDPOINTS.OFERTAS.BASE,
        { params },
      );
      return data.data;
    },
  });

  const { data: postulaciones, isLoading: loadingPost } = useQuery({
    queryKey: ['postulaciones-oferta', selected?.id],
    enabled: postulacionesOpen && !!selected,
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Postulacion[] }>(
        ENDPOINTS.OFERTAS.POSTULACIONES(selected!.id),
      );
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(ENDPOINTS.OFERTAS.BASE, {
        ...form,
        remuneracion: form.remuneracion ? Number(form.remuneracion) : undefined,
        vacantes: Number(form.vacantes),
        fechaLimite: form.fechaLimite || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Oferta creada correctamente');
      setCreateOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
    },
    onError: () => toast.error('No se pudo crear la oferta'),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await apiClient.put(ENDPOINTS.OFERTAS.BY_ID(selected.id), {
        ...form,
        remuneracion: form.remuneracion ? Number(form.remuneracion) : undefined,
        vacantes: Number(form.vacantes),
        fechaLimite: form.fechaLimite || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Oferta actualizada correctamente');
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
    },
    onError: () => toast.error('No se pudo actualizar la oferta'),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(ENDPOINTS.OFERTAS.BY_ID(id));
    },
    onSuccess: () => {
      toast.success('Oferta desactivada');
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
    },
    onError: () => toast.error('No se pudo desactivar la oferta'),
  });

  const estadoMutation = useMutation({
    mutationFn: async ({ postId, estado }: { postId: number; estado: EstadoPostulacion }) => {
      await apiClient.put(ENDPOINTS.OFERTAS.ESTADO_POSTULACION(postId), { estado });
    },
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['postulaciones-oferta', selected?.id] });
    },
    onError: () => toast.error('No se pudo actualizar el estado'),
  });

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((o) =>
      o.titulo.toLowerCase().includes(q) ||
      o.empresa?.razonSocial?.toLowerCase().includes(q) ||
      o.modalidad?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const openEdit = (oferta: Oferta) => {
    setSelected(oferta);
    setForm({
      titulo: oferta.titulo,
      descripcion: oferta.descripcion,
      requisitos: oferta.requisitos,
      modalidad: oferta.modalidad,
      remuneracion: oferta.remuneracion?.toString() ?? '',
      vacantes: oferta.vacantes,
      fechaLimite: oferta.fechaLimite ? oferta.fechaLimite.slice(0, 10) : '',
      activo: oferta.activo,
    });
    setEditOpen(true);
  };

  const columns: Column<Oferta & { _count?: { postulaciones: number } }>[] = [
    { key: 'titulo', header: 'Título', render: (o) => <span className="font-medium text-slate-800">{o.titulo}</span> },
    { key: 'modalidad', header: 'Modalidad', render: (o) => <span className="text-sm text-slate-600">{o.modalidad}</span> },
    ...(isEmpresa
      ? []
      : [{ key: 'empresa' as any, header: 'Empresa', render: (o: any) => <span className="text-sm text-slate-600">{o.empresa?.razonSocial ?? '—'}</span> }]),
    { key: 'vacantes', header: 'Vacantes', render: (o) => <span className="text-sm">{o.vacantes}</span> },
    {
      key: 'activo' as any,
      header: 'Estado',
      render: (o) => (
        <span className={`badge ${o.activo ? 'badge-activo' : 'badge-inactivo'}`}>
          {o.activo ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      key: 'fechaLimite' as any,
      header: 'Fecha límite',
      render: (o) => <span className="text-sm text-slate-500">{o.fechaLimite ? formatDate(o.fechaLimite) : '—'}</span>,
    },
    {
      key: 'actions' as any,
      header: 'Acciones',
      render: (o) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelected(o); setDetailOpen(true); }}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
          {(isEmpresa || isAdmin) && (
            <>
              <button
                onClick={() => { setSelected(o); setPostulacionesOpen(true); }}
                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                title="Ver postulaciones"
              >
                <Users className="h-4 w-4" />
              </button>
              <button
                onClick={() => openEdit(o)}
                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeMutation.mutate(o.id)}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                title="Desactivar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const OfertaFormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
        <input className="input-field" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
        <textarea className="input-field min-h-[80px]" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Requisitos</label>
        <textarea className="input-field min-h-[80px]" value={form.requisitos} onChange={(e) => setForm((f) => ({ ...f, requisitos: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Modalidad</label>
          <select className="input-field" value={form.modalidad} onChange={(e) => setForm((f) => ({ ...f, modalidad: e.target.value }))}>
            <option value="PRESENCIAL">Presencial</option>
            <option value="REMOTO">Remoto</option>
            <option value="HIBRIDO">Híbrido</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vacantes</label>
          <input type="number" min={1} className="input-field" value={form.vacantes} onChange={(e) => setForm((f) => ({ ...f, vacantes: +e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Remuneración (S/)</label>
          <input type="number" min={0} className="input-field" value={form.remuneracion} onChange={(e) => setForm((f) => ({ ...f, remuneracion: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha límite</label>
          <input type="date" className="input-field" value={form.fechaLimite} onChange={(e) => setForm((f) => ({ ...f, fechaLimite: e.target.value }))} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={isEmpresa ? 'Mis ofertas' : 'Ofertas de práctica'}
        subtitle={isEmpresa ? 'Gestiona tus ofertas de práctica preprofesional' : 'Encuentra oportunidades de práctica'}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar oferta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {isEmpresa && (
              <button
                onClick={() => { setForm(emptyForm); setCreateOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nueva oferta
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          emptyMessage="No hay ofertas disponibles"
          page={page}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>

      {/* Modal: Detalle */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle de oferta"
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <p><span className="font-semibold">Título:</span> {selected.titulo}</p>
            <p><span className="font-semibold">Empresa:</span> {selected.empresa?.razonSocial}</p>
            <p><span className="font-semibold">Modalidad:</span> {selected.modalidad}</p>
            <p><span className="font-semibold">Vacantes:</span> {selected.vacantes}</p>
            {selected.remuneracion != null && (
              <p><span className="font-semibold">Remuneración:</span> S/ {selected.remuneracion}</p>
            )}
            {selected.fechaLimite && (
              <p><span className="font-semibold">Fecha límite:</span> {formatDate(selected.fechaLimite)}</p>
            )}
            <div>
              <p className="font-semibold">Descripción:</p>
              <p className="text-slate-600 whitespace-pre-line">{selected.descripcion}</p>
            </div>
            <div>
              <p className="font-semibold">Requisitos:</p>
              <p className="text-slate-600 whitespace-pre-line">{selected.requisitos}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Postulaciones */}
      <Modal
        isOpen={postulacionesOpen}
        onClose={() => setPostulacionesOpen(false)}
        title={`Postulaciones — ${selected?.titulo ?? ''}`}
      >
        {loadingPost ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : !postulaciones?.length ? (
          <p className="text-sm text-slate-500">No hay postulaciones para esta oferta.</p>
        ) : (
          <div className="space-y-3">
            {postulaciones.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {p.estudiante?.nombres} {p.estudiante?.apellidos}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(p.fechaPostulacion)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${estadoPostulacionColors[p.estado]}`}>
                    {estadoPostulacionLabels[p.estado]}
                  </span>
                  {p.estado === EstadoPostulacion.PENDIENTE && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => estadoMutation.mutate({ postId: p.id, estado: EstadoPostulacion.ACEPTADA })}
                        className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => estadoMutation.mutate({ postId: p.id, estado: EstadoPostulacion.RECHAZADA })}
                        className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal: Crear */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nueva oferta"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setCreateOpen(false)} className="btn-secondary">Cancelar</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.titulo}
              className="btn-primary"
            >
              Crear
            </button>
          </div>
        }
      >
        <OfertaFormFields />
      </Modal>

      {/* Modal: Editar */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar oferta"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditOpen(false)} className="btn-secondary">Cancelar</button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-primary"
            >
              Guardar
            </button>
          </div>
        }
      >
        <OfertaFormFields />
      </Modal>
    </div>
  );
}
