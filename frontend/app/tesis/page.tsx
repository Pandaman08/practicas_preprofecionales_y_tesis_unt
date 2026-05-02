'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Tesis, PaginatedResponse, EstadoTesis } from '@/lib/types';
import Header from '@/components/layouts/Header';
import DataTable, { Column } from '@/components/shared/DataTable';
import { formatDate } from '@/lib/utils/formatDate';

const estadoLabels: Record<EstadoTesis, string> = {
  EN_PROCESO: 'En proceso',
  LISTA_SUSTENTACION: 'Lista para sustentar',
  SUSTENTADA: 'Sustentada',
  APROBADA: 'Aprobada',
};

const estadoColors: Record<EstadoTesis, string> = {
  EN_PROCESO: 'badge-pendiente',
  LISTA_SUSTENTACION: 'badge-activo',
  SUSTENTADA: 'badge-activo',
  APROBADA: 'badge-activo',
};

export default function TesisPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tesis', page, search],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Tesis> }>(
        ENDPOINTS.TESIS.BASE,
        { params: { page, limit: 10 } }
      );
      return data.data;
    },
  });

  const columns: Column<Tesis>[] = [
    {
      key: 'titulo',
      header: 'Título',
      render: (v, row) => (
        <Link href={`/tesis/${row.id}`} className="text-blue-600 hover:underline font-medium">
          {v}
        </Link>
      ),
    },
    {
      key: 'estudiante',
      header: 'Estudiante',
      render: (_, row) =>
        `${row.estudiante?.usuario?.nombres} ${row.estudiante?.usuario?.apellidos}`,
    },
    {
      key: 'asesor',
      header: 'Asesor',
      render: (_, row) =>
        `${row.asesor?.usuario?.nombres} ${row.asesor?.usuario?.apellidos}`,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (v) => v === 'PREGRADO' ? 'Pregrado' : 'Posgrado',
    },
    {
      key: 'fechaInicio',
      header: 'Inicio',
      render: (v) => formatDate(v),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (v: EstadoTesis) => (
        <span className={estadoColors[v]}>{estadoLabels[v]}</span>
      ),
    },
  ];

  return (
    <>
      <Header title="Tesis" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tesis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <Link href="/tesis/nueva" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva tesis
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
          emptyMessage="No hay tesis registradas"
        />
      </div>
    </>
  );
}
