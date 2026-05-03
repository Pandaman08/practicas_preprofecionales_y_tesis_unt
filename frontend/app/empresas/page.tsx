'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Eye, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Empresa, PaginatedResponse, Rol } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layouts/Header';
import DataTable, { Column } from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import EmpresaCreateForm from '@/components/forms/EmpresaCreateForm';

export default function EmpresasPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = user?.rol === Rol.ADMIN;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [activo, setActivo] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDirty, setCreateDirty] = useState(false);
  const [selected, setSelected] = useState<Empresa | null>(null);
  const [form, setForm] = useState({
    razonSocial: '',
    ruc: '',
    sector: '',
    direccion: '',
    contactoNombre: '',
    contactoEmail: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['empresas', page, search, sector, activo],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Empresa> }>(
        ENDPOINTS.EMPRESAS.BASE,
        { params: { page, limit: 10, search, sector, activo: activo || undefined } },
      );
      return data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await apiClient.put(ENDPOINTS.EMPRESAS.BY_ID(selected.id), form);
    },
    onSuccess: () => {
      toast.success('Empresa actualizada correctamente');
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
    onError: () => toast.error('No se pudo actualizar la empresa'),
  });

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ usuarioId, activoNuevo }: { usuarioId: number; activoNuevo: boolean }) => {
      await apiClient.put(ENDPOINTS.USERS.BY_ID(usuarioId), { activo: activoNuevo });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.activoNuevo ? 'Empresa reactivada' : 'Empresa inactivada');
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
    onError: () => toast.error('No se pudo actualizar el estado de la empresa'),
  });

  const rows = useMemo(() => data?.data ?? [], [data]);

  const columns: Column<Empresa>[] = [
    {
      key: 'razonSocial',
      header: 'Empresa',
      sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <Building2 className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{v}</p>
            <p className="text-xs text-slate-500">RUC: {row.ruc}</p>
          </div>
        </div>
      ),
    },
    { key: 'sector', header: 'Sector', sortable: true },
    { key: 'direccion', header: 'Direccion' },
    {
      key: 'contactoNombre',
      header: 'Contacto',
      render: (_, row) => (
        <div>
          <p>{row.contactoNombre || '-'}</p>
          <p className="text-xs text-slate-500">{row.contactoEmail || '-'}</p>
        </div>
      ),
    },
    {
      key: 'usuario',
      header: 'Estado',
      render: (v: Empresa['usuario']) => (
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
                    razonSocial: row.razonSocial,
                    ruc: row.ruc,
                    sector: row.sector || '',
                    direccion: row.direccion || '',
                    contactoNombre: row.contactoNombre || '',
                    contactoEmail: row.contactoEmail || '',
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
      <Header title="Gestion de Empresas" />
      <div className="h-[calc(100vh-73px)] overflow-hidden bg-slate-50 p-4 sm:p-6">
        <div className="flex h-full flex-col gap-4">
        <section className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar empresa, RUC o contacto"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9"
              />
            </div>

            <input
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="input-field"
              placeholder="Sector"
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
                setSector('');
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
                Crear empresa
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
          emptyMessage="No hay empresas para los filtros aplicados"
          mobileCardTitle={(row) => row.razonSocial}
          rowClassName={(row) => (!row.usuario?.activo ? 'opacity-70 bg-slate-50' : '')}
        />
        </div>
        </div>
      </div>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de empresa" maxWidthClassName="max-w-xl">
        {selected && (
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <p><strong>Razon social:</strong> {selected.razonSocial}</p>
            <p><strong>RUC:</strong> {selected.ruc}</p>
            <p><strong>Sector:</strong> {selected.sector || '-'}</p>
            <p><strong>Direccion:</strong> {selected.direccion || '-'}</p>
            <p><strong>Contacto:</strong> {selected.contactoNombre || '-'}</p>
            <p><strong>Email contacto:</strong> {selected.contactoEmail || '-'}</p>
            <p className="sm:col-span-2"><strong>Email de usuario:</strong> {selected.usuario?.email || '-'}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateDirty(false);
        }}
        title="Crear empresa"
        description="Registro rapido desde la vista actual"
        maxWidthClassName="max-w-3xl"
        confirmOnCloseWhenDirty
        isDirty={createDirty}
      >
        {createOpen ? (
          <EmpresaCreateForm
            onCancel={() => {
              setCreateOpen(false);
              setCreateDirty(false);
            }}
            onSuccess={() => {
              setCreateOpen(false);
              setCreateDirty(false);
              queryClient.invalidateQueries({ queryKey: ['empresas'] });
            }}
            onDirtyChange={setCreateDirty}
          />
        ) : null}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar empresa"
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
          <input className="input-field" value={form.razonSocial} onChange={(e) => setForm((p) => ({ ...p, razonSocial: e.target.value }))} placeholder="Razon social" />
          <input className="input-field" value={form.ruc} onChange={(e) => setForm((p) => ({ ...p, ruc: e.target.value }))} placeholder="RUC" />
          <input className="input-field" value={form.sector} onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))} placeholder="Sector" />
          <input className="input-field" value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} placeholder="Direccion" />
          <input className="input-field" value={form.contactoNombre} onChange={(e) => setForm((p) => ({ ...p, contactoNombre: e.target.value }))} placeholder="Contacto" />
          <input className="input-field" value={form.contactoEmail} onChange={(e) => setForm((p) => ({ ...p, contactoEmail: e.target.value }))} placeholder="Email contacto" />
        </div>
      </Modal>
    </>
  );
}
