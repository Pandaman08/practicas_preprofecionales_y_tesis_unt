'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Estudiante, PaginatedResponse } from '@/lib/types';
import Header from '@/components/layouts/Header';
import DataTable, { Column } from '@/components/shared/DataTable';

export default function EstudiantesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['estudiantes', page, search],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Estudiante> }>(
        ENDPOINTS.ESTUDIANTES.BASE,
        { params: { page, limit: 10 } }
      );
      return data.data;
    },
  });

  const columns: Column<Estudiante>[] = [
    {
      key: 'usuario',
      header: 'Nombre',
      render: (v) => `${v?.nombres} ${v?.apellidos}`,
    },
    { key: 'codigo', header: 'Código' },
    { key: 'dni', header: 'DNI' },
    { key: 'especialidad', header: 'Especialidad' },
    {
      key: 'ciclo',
      header: 'Ciclo',
      render: (v) => `${v}°`,
    },
    {
      key: 'usuario',
      header: 'Email',
      render: (v) => (
        <span className="text-sm text-gray-500">{v?.email}</span>
      ),
    },
  ];

  return (
    <>
      <Header title="Estudiantes" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
          total={data?.total ?? 0}
          page={page}
          limit={10}
          onPageChange={setPage}
          emptyMessage="No hay estudiantes registrados"
        />
      </div>
    </>
  );
}
