'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Pencil, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Empresa } from '@/lib/types';
import Header from '@/components/layouts/Header';

export default function MiEmpresaPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    razonSocial: '',
    sector: '',
    direccion: '',
    telefono: '',
    contactoNombre: '',
    contactoEmail: '',
  });

  const { data: empresa, isLoading } = useQuery({
    queryKey: ['mi-empresa'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Empresa }>(
        ENDPOINTS.EMPRESAS.MI_PERFIL,
      );
      return data.data;
    },
  });

  useEffect(() => {
    if (empresa) {
      setForm({
        razonSocial: empresa.razonSocial ?? '',
        sector: empresa.sector ?? '',
        direccion: empresa.direccion ?? '',
        telefono: empresa.telefono ?? '',
        contactoNombre: empresa.contactoNombre ?? '',
        contactoEmail: empresa.contactoEmail ?? '',
      });
    }
  }, [empresa]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put(ENDPOINTS.EMPRESAS.MI_PERFIL, form);
    },
    onSuccess: () => {
      toast.success('Perfil actualizado correctamente');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['mi-empresa'] });
    },
    onError: () => toast.error('No se pudo actualizar el perfil'),
  });

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      {editing ? (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <p className="text-sm text-slate-800">{(empresa as any)?.[key] || '—'}</p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Mi empresa" subtitle="Datos y perfil de tu empresa" />

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Cargando...</div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Encabezado tarjeta */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{empresa?.razonSocial}</h2>
                    <p className="text-sm text-slate-500">RUC: {empresa?.ruc}</p>
                  </div>
                </div>

                {editing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(false); if (empresa) setForm({ razonSocial: empresa.razonSocial ?? '', sector: empresa.sector ?? '', direccion: empresa.direccion ?? '', telefono: empresa.telefono ?? '', contactoNombre: empresa.contactoNombre ?? '', contactoEmail: empresa.contactoEmail ?? '' }); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                    <button
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      Guardar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {field('Razón social', 'razonSocial')}
                {field('Sector', 'sector')}
                {field('Dirección', 'direccion')}
                {field('Teléfono', 'telefono', 'tel')}
                {field('Contacto', 'contactoNombre')}
                {field('Email de contacto', 'contactoEmail', 'email')}
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-blue-700">{(empresa as any)?.ofertas?.length ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Ofertas publicadas</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-emerald-700">{(empresa as any)?.convenios?.length ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Convenios activos</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
