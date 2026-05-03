'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { EstadoTesis, PaginatedResponse, Rol, Tesis } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layouts/Header';
import DataTable, { Column } from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import { formatDate } from '@/lib/utils/formatDate';
import TesisCreateForm from '@/components/forms/TesisCreateForm';

const estadoLabels: Record<string, string> = {
  PROPUESTA: 'Propuesta',
  EN_DESARROLLO: 'En desarrollo',
  OBSERVADA: 'Observada',
  LISTA_SUSTENTACION: 'Lista sustentacion',
  SUSTENTADA: 'Sustentada',
  APROBADA: 'Aprobada',
};

const estadoColors: Record<string, string> = {
  PROPUESTA: 'badge-pendiente',
  EN_DESARROLLO: 'badge-pendiente',
  OBSERVADA: 'badge-inactivo',
  LISTA_SUSTENTACION: 'badge-activo',
  SUSTENTADA: 'badge-activo',
  APROBADA: 'badge-activo',
};

export default function TesisPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canCreate = user?.rol === Rol.ADMIN || user?.rol === Rol.COORDINADOR || user?.rol === Rol.ESTUDIANTE;
  const canManage = user?.rol === Rol.ADMIN || user?.rol === Rol.COORDINADOR || user?.rol === Rol.ASESOR || user?.rol === Rol.ESTUDIANTE;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDirty, setCreateDirty] = useState(false);
  const [selected, setSelected] = useState<Tesis | null>(null);
  const [form, setForm] = useState({
    titulo: '',
    resumen: '',
    estado: 'PROPUESTA',
    tipo: 'TESIS',
    fechaInicio: '',
    fechaSustentacion: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tesis', page, estado, user?.rol, user?.perfil?.id],
    queryFn: async () => {
        const asesorId = user?.rol === Rol.ASESOR ? user?.perfil?.id : undefined;
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Tesis> }>(
        ENDPOINTS.TESIS.BASE,
        { params: { page, limit: 10, estado: estado || undefined, asesorId } },
      );
      return data.data;
    },
  });

  const filteredRows = useMemo(() => {
    const rows = data?.data ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) => {
      const estudiante = `${row.estudiante?.nombres ?? ''} ${row.estudiante?.apellidos ?? ''}`.toLowerCase();
      const asesor = `${row.asesor?.nombres ?? ''} ${row.asesor?.apellidos ?? ''}`.toLowerCase();
      const titulo = (row.titulo ?? '').toLowerCase();
      return estudiante.includes(q) || asesor.includes(q) || titulo.includes(q);
    });
  }, [data, search]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await apiClient.put(ENDPOINTS.TESIS.BY_ID(selected.id), {
        titulo: form.titulo,
        resumen: form.resumen,
        estado: form.estado,
        tipo: form.tipo,
        fechaInicio: form.fechaInicio ? new Date(form.fechaInicio).toISOString() : null,
        fechaSustentacion: form.fechaSustentacion ? new Date(form.fechaSustentacion).toISOString() : null,
      });
    },
    onSuccess: () => {
      toast.success('Tesis actualizada correctamente');
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tesis'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      const detail = Array.isArray(message) ? message.join(', ') : message;
      toast.error(detail || 'No se pudo actualizar la tesis');
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: async ({ id, estadoNuevo }: { id: number; estadoNuevo: EstadoTesis }) => {
      await apiClient.put(ENDPOINTS.TESIS.BY_ID(id), { estado: estadoNuevo });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.estadoNuevo === EstadoTesis.OBSERVADA ? 'Tesis inactivada' : 'Tesis reactivada');
      queryClient.invalidateQueries({ queryKey: ['tesis'] });
    },
    onError: () => toast.error('No se pudo actualizar el estado de la tesis'),
  });

  const columns: Column<Tesis>[] = [
    {
      key: 'titulo',
      header: 'Titulo',
      sortable: true,
      render: (v, row) => (
        <div>
          <p className="font-medium text-slate-800">{v}</p>
          <p className="text-xs text-slate-500">{row.estudiante?.nombres} {row.estudiante?.apellidos}</p>
        </div>
      ),
    },
    {
      key: 'asesor',
      header: 'Asesor',
      render: (_, row) => (row.asesor ? `${row.asesor.nombres} ${row.asesor.apellidos}` : '-'),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      sortable: true,
    },
    {
      key: 'fechaInicio',
      header: 'Inicio',
      render: (v) => (v ? formatDate(v) : '-'),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (v: EstadoTesis) => <span className={estadoColors[v] || 'badge-pendiente'}>{estadoLabels[v] || v}</span>,
    },
    {
      key: 'id',
      header: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelected(row);
              setDetailOpen(true);
            }}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>

          <Link href={`/tesis/${row.id}`} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" title="Abrir pagina detalle">
            <Search className="h-4 w-4" />
          </Link>

          {canManage && (
            <>
              <button
                onClick={() => {
                  setSelected(row);
                  setForm({
                    titulo: row.titulo,
                    resumen: row.resumen || '',
                    estado: row.estado,
                    tipo: row.tipo,
                    fechaInicio: row.fechaInicio ? String(row.fechaInicio).slice(0, 10) : '',
                    fechaSustentacion: row.fechaSustentacion ? String(row.fechaSustentacion).slice(0, 10) : '',
                  });
                  setEditOpen(true);
                }}
                className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>

              <button
                onClick={() =>
                  softDeleteMutation.mutate({
                    id: row.id,
                    estadoNuevo: row.estado === EstadoTesis.OBSERVADA ? EstadoTesis.EN_DESARROLLO : EstadoTesis.OBSERVADA,
                  })
                }
                className={`rounded-md p-2 ${
                  row.estado === EstadoTesis.OBSERVADA ? 'text-emerald-600 hover:bg-emerald-50' : 'text-rose-600 hover:bg-rose-50'
                }`}
                title={row.estado === EstadoTesis.OBSERVADA ? 'Reactivar' : 'Inactivar'}
              >
                {row.estado === EstadoTesis.OBSERVADA ? <RefreshCw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Header title="Gestion de Tesis" />
      <div className="h-[calc(100vh-73px)] overflow-hidden bg-slate-50 p-4 sm:p-6">
        <div className="flex h-full flex-col gap-4">
        <section className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="grid w-full grid-cols-1 gap-3 md:max-w-3xl md:grid-cols-3">
              <div className="relative md:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" placeholder="Buscar por titulo, estudiante o asesor" />
              </div>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} className="input-field">
                <option value="">Todos los estados</option>
                {Object.entries(estadoLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {canCreate ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
              >
                <Plus className="h-4 w-4" /> Nueva tesis
              </button>
            ) : null}
          </div>

          <div className="mt-3">
            <button
              onClick={() => {
                setSearch('');
                setEstado('');
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        <div className="min-h-0 flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={filteredRows}
          loading={isLoading}
          total={data?.total ?? 0}
          page={page}
          limit={10}
          onPageChange={setPage}
          emptyMessage="No hay tesis para los filtros aplicados"
          mobileCardTitle={(row) => row.titulo}
          rowClassName={(row) => (row.estado === EstadoTesis.OBSERVADA ? 'opacity-70 bg-slate-50' : '')}
        />
        </div>
        </div>
      </div>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de tesis" maxWidthClassName="max-w-2xl">
        {selected && (
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <p><strong>Titulo:</strong> {selected.titulo}</p>
            <p><strong>Estado:</strong> {estadoLabels[selected.estado] || selected.estado}</p>
            <p><strong>Tipo:</strong> {selected.tipo}</p>
            <p><strong>Inicio:</strong> {selected.fechaInicio ? formatDate(selected.fechaInicio) : '-'}</p>
            <p><strong>Sustentacion:</strong> {selected.fechaSustentacion ? formatDate(selected.fechaSustentacion) : '-'}</p>
            <p><strong>Estudiante:</strong> {selected.estudiante?.nombres} {selected.estudiante?.apellidos}</p>
            <p className="sm:col-span-2"><strong>Resumen:</strong> {selected.resumen || '-'}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateDirty(false);
        }}
        title="Nueva tesis"
        description="Registro rapido desde la vista actual"
        maxWidthClassName="max-w-3xl"
        confirmOnCloseWhenDirty
        isDirty={createDirty}
      >
        {createOpen ? (
          <TesisCreateForm
            onCancel={() => {
              setCreateOpen(false);
              setCreateDirty(false);
            }}
            onSuccess={() => {
              setCreateOpen(false);
              setCreateDirty(false);
              queryClient.invalidateQueries({ queryKey: ['tesis'] });
            }}
            onDirtyChange={setCreateDirty}
          />
        ) : null}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar tesis"
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setEditOpen(false)} className="btn-secondary text-sm">Cancelar</button>
            <button onClick={() => saveMutation.mutate()} className="btn-primary px-4 py-2 text-sm" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className="input-field sm:col-span-2" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} placeholder="Titulo" />
          <select className="input-field" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
            <option value="TESIS">Tesis</option>
            <option value="TRABAJO_SUFICIENCIA">Trabajo de suficiencia</option>
            <option value="PROYECTO_INVESTIGACION">Proyecto de investigacion</option>
          </select>
          <select className="input-field" value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}>
            {Object.entries(estadoLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input type="date" className="input-field" value={form.fechaInicio} onChange={(e) => setForm((p) => ({ ...p, fechaInicio: e.target.value }))} />
          <input type="date" className="input-field" value={form.fechaSustentacion} onChange={(e) => setForm((p) => ({ ...p, fechaSustentacion: e.target.value }))} />
          <textarea className="input-field sm:col-span-2" rows={3} value={form.resumen} onChange={(e) => setForm((p) => ({ ...p, resumen: e.target.value }))} placeholder="Resumen" />
        </div>
      </Modal>
    </>
  );
}
