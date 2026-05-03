'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Asesor, PaginatedResponse, Rol } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layouts/Header';
import DataTable, { Column } from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import AsesorCreateForm from '@/components/forms/AsesorCreateForm';

export default function AsesoresPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = user?.rol === Rol.ADMIN;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [activo, setActivo] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDirty, setCreateDirty] = useState(false);
  const [selected, setSelected] = useState<Asesor | null>(null);
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    especialidad: '',
    telefono: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['asesores', page, especialidad, activo],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Asesor> }>(
        ENDPOINTS.ASESORES.BASE,
        { params: { page, limit: 10, especialidad, activo: activo || undefined } },
      );
      return data.data;
    },
  });

  const rows = useMemo(() => {
    const base = data?.data ?? [];
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((item) => (`${item.nombres} ${item.apellidos}`.toLowerCase().includes(q) || (item.usuario?.email || '').toLowerCase().includes(q)));
  }, [data, search]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await apiClient.put(ENDPOINTS.ASESORES.BY_ID(selected.id), form);
    },
    onSuccess: () => {
      toast.success('Asesor actualizado correctamente');
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['asesores'] });
    },
    onError: () => toast.error('No se pudo actualizar el asesor'),
  });

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ usuarioId, activoNuevo }: { usuarioId: number; activoNuevo: boolean }) => {
      await apiClient.put(ENDPOINTS.USERS.BY_ID(usuarioId), { activo: activoNuevo });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.activoNuevo ? 'Asesor reactivado' : 'Asesor inactivado');
      queryClient.invalidateQueries({ queryKey: ['asesores'] });
    },
    onError: () => toast.error('No se pudo actualizar el estado del asesor'),
  });

  const columns: Column<Asesor>[] = [
    {
      key: 'nombres',
      header: 'Asesor',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800">{row.nombres} {row.apellidos}</p>
          <p className="text-xs text-slate-500">{row.usuario?.email}</p>
        </div>
      ),
    },
    { key: 'especialidad', header: 'Especialidad', sortable: true },
    { key: 'telefono', header: 'Telefono' },
    {
      key: 'usuario',
      header: 'Estado',
      render: (v: Asesor['usuario']) => (
        <span className={v?.activo ? 'badge-activo' : 'badge-inactivo'}>{v?.activo ? 'Activo' : 'Inactivo'}</span>
      ),
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

          {canManage && (
            <>
              <button
                onClick={() => {
                  setSelected(row);
                  setForm({
                    nombres: row.nombres,
                    apellidos: row.apellidos,
                    especialidad: row.especialidad,
                    telefono: row.telefono || '',
                  });
                  setEditOpen(true);
                }}
                className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  if (!row.usuario?.id) return toast.error('No se encontro usuario vinculado');
                  const activoNuevo = !row.usuario.activo;
                  toggleActivoMutation.mutate({ usuarioId: row.usuario.id, activoNuevo });
                }}
                className={`rounded-md p-2 ${
                  row.usuario?.activo ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                }`}
                title={row.usuario?.activo ? 'Inactivar' : 'Reactivar'}
              >
                {row.usuario?.activo ? <Trash2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Header title="Gestion de Asesores" />
      <div className="h-[calc(100vh-73px)] overflow-hidden bg-slate-50 p-4 sm:p-6">
        <div className="flex h-full flex-col gap-4">
        <section className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar asesor por nombre o correo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9"
              />
            </div>
            <input
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              className="input-field"
              placeholder="Especialidad"
            />
            <select value={activo} onChange={(e) => setActivo(e.target.value)} className="input-field">
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => {
                setSearch('');
                setEspecialidad('');
                setActivo('');
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Limpiar filtros
            </button>

            {canManage ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Crear asesor
              </button>
            ) : null}
          </div>
        </section>

        <div className="min-h-0 flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          total={data?.total ?? 0}
          page={page}
          limit={10}
          onPageChange={setPage}
          emptyMessage="No hay asesores para los filtros aplicados"
          mobileCardTitle={(row) => `${row.nombres} ${row.apellidos}`}
          rowClassName={(row) => (!row.usuario?.activo ? 'opacity-70 bg-slate-50' : '')}
        />
        </div>
        </div>
      </div>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de asesor" maxWidthClassName="max-w-xl">
        {selected && (
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <p><strong>Nombres:</strong> {selected.nombres}</p>
            <p><strong>Apellidos:</strong> {selected.apellidos}</p>
            <p><strong>Especialidad:</strong> {selected.especialidad}</p>
            <p><strong>Telefono:</strong> {selected.telefono || '-'}</p>
            <p className="sm:col-span-2"><strong>Email:</strong> {selected.usuario?.email}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateDirty(false);
        }}
        title="Crear asesor"
        description="Registro rapido desde la vista actual"
        maxWidthClassName="max-w-3xl"
        confirmOnCloseWhenDirty
        isDirty={createDirty}
      >
        {createOpen ? (
          <AsesorCreateForm
            onCancel={() => {
              setCreateOpen(false);
              setCreateDirty(false);
            }}
            onSuccess={() => {
              setCreateOpen(false);
              setCreateDirty(false);
              queryClient.invalidateQueries({ queryKey: ['asesores'] });
            }}
            onDirtyChange={setCreateDirty}
          />
        ) : null}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar asesor"
        maxWidthClassName="max-w-xl"
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
          <input className="input-field" value={form.nombres} onChange={(e) => setForm((p) => ({ ...p, nombres: e.target.value }))} placeholder="Nombres" />
          <input className="input-field" value={form.apellidos} onChange={(e) => setForm((p) => ({ ...p, apellidos: e.target.value }))} placeholder="Apellidos" />
          <input className="input-field" value={form.especialidad} onChange={(e) => setForm((p) => ({ ...p, especialidad: e.target.value }))} placeholder="Especialidad" />
          <input className="input-field" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="Telefono" />
        </div>
      </Modal>
    </>
  );
}
