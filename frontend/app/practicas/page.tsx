'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Practica, PaginatedResponse, EstadoPractica } from '@/lib/types';
import Header from '@/components/layouts/Header';
import DataTable, { Column } from '@/components/shared/DataTable';
import { formatDate } from '@/lib/utils/formatDate';

const estadoColors: Record<string, string> = {
  EN_PROCESO: 'badge-activo',
  EN_CURSO: 'badge-activo',
  PENDIENTE: 'badge-pendiente',
  COMPLETADA: 'badge-pendiente',
  SUSPENDIDA: 'badge-inactivo',
  CANCELADA: 'badge-inactivo',
};

const estadoLabels: Record<string, string> = {
  EN_PROCESO: 'En proceso',
  EN_CURSO: 'En curso',
  PENDIENTE: 'Pendiente',
  COMPLETADA: 'Completada',
  SUSPENDIDA: 'Suspendida',
  CANCELADA: 'Cancelada',
};

export default function PracticasPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['practicas', page, search],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Practica> }>(
        ENDPOINTS.PRACTICAS.BASE,
        { params: { page, limit: 10 } }
      );
      return data.data;
    },
  });

  const columns: Column<Practica>[] = [
    {
      key: 'estudiante',
      header: 'Estudiante',
      render: (_, row) =>
        `${row.estudiante?.usuario?.nombres} ${row.estudiante?.usuario?.apellidos}`,
    },
    {
      key: 'empresa',
      header: 'Empresa',
      render: (_, row) => row.empresa?.razonSocial ?? '-',
    },
    {
      key: 'fechaInicio',
      header: 'Inicio',
      render: (v) => formatDate(v),
    },
    {
      key: 'fechaFin',
      header: 'Fin',
      render: (v) => formatDate(v),
    },
    {
      key: 'horasCompletadas',
      header: 'Horas',
      render: (_, row) => `${row.horasCompletadas}/${row.totalHoras}`,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (v: EstadoPractica) => (
        <span className={estadoColors[v] || 'badge-pendiente'}>{estadoLabels[v] || v}</span>
      ),
    },
    {
      key: 'id',
      header: 'Acciones',
      render: (v) => (
        <Link href={`/practicas/${v}`} className="text-blue-600 hover:underline text-sm">
          Ver detalle
        </Link>
      ),
    },
  ];

  return (
    <>
      <Header title="Prácticas Preprofesionales" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar práctica..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <Link href="/practicas/nueva" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva práctica
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
          total={data?.total ?? 0}
          page={page}
          limit={10}
          onPageChange={setPage}
          emptyMessage="No hay prácticas registradas"
        />
      </div>
    </>
  );
}
