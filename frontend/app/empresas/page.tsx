'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2 } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Empresa, PaginatedResponse } from '@/lib/types';
import Header from '@/components/layouts/Header';
import DataTable, { Column } from '@/components/shared/DataTable';

export default function EmpresasPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['empresas', page, search],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Empresa> }>(
        ENDPOINTS.EMPRESAS.BASE,
        { params: { page, limit: 10, search } }
      );
      return data.data;
    },
  });

  const columns: Column<Empresa>[] = [
    {
      key: 'razonSocial',
      header: 'Empresa',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Building2 className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">{v}</p>
            <p className="text-xs text-gray-500">{row.ruc}</p>
          </div>
        </div>
      ),
    },
    { key: 'sector', header: 'Sector' },
    { key: 'direccion', header: 'Dirección' },
    {
      key: 'contactoEmail',
      header: 'Contacto',
      render: (v, row) => (
        <div>
          <p className="text-sm">{row.contactoNombre || '-'}</p>
          <p className="text-xs text-gray-500">{v || ''}</p>
        </div>
      ),
    },
    {
      key: '_count',
      header: 'Ofertas',
      render: (v) => v?.ofertas ?? 0,
    },
    {
      key: '_count',
      header: 'Convenios',
      render: (v) => v?.convenios ?? 0,
    },
  ];

  return (
    <>
      <Header title="Empresas" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empresa..."
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
          emptyMessage="No hay empresas registradas"
        />
      </div>
    </>
  );
}
