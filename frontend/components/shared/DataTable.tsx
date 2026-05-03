'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  mobileCardTitle?: (row: T) => string;
  rowClassName?: (row: T) => string;
}

export default function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  loading,
  total = 0,
  page = 1,
  limit = 10,
  onPageChange,
  emptyMessage = 'No hay datos disponibles',
  mobileCardTitle,
  rowClassName,
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const totalPages = Math.ceil(total / limit);

  const sortedData = useMemo(() => {
    if (!sortBy) return data;
    return [...data].sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];

      if (av === bv) return 0;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;

      const aNorm = typeof av === 'string' ? av.toLowerCase() : av;
      const bNorm = typeof bv === 'string' ? bv.toLowerCase() : bv;
      const result = aNorm > bNorm ? 1 : -1;
      return sortDir === 'asc' ? result : -result;
    });
  }, [data, sortBy, sortDir]);

  const onSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortBy === col.key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(col.key);
    setSortDir('asc');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="md:hidden space-y-3">
        {sortedData.map((row, idx) => (
          <article
            key={row.id ?? idx}
            className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${rowClassName ? rowClassName(row) : ''}`}
          >
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              {mobileCardTitle ? mobileCardTitle(row) : `Registro #${row.id ?? idx + 1}`}
            </h3>
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-3 text-xs">
                  <span className="font-medium text-gray-500">{col.header}</span>
                  <span className="text-right text-gray-700">
                    {col.render
                      ? col.render((row as any)[col.key], row)
                      : (row as any)[col.key] ?? '-'}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                    col.className || ''
                  }`}
                >
                  <button
                    type="button"
                    disabled={!col.sortable}
                    onClick={() => onSort(col)}
                    className={`inline-flex items-center gap-1 ${col.sortable ? 'hover:text-gray-700' : 'cursor-default'}`}
                  >
                    {col.header}
                    {sortBy === col.key && (
                      <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sortedData.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className={`transition-colors hover:bg-gray-50 ${rowClassName ? rowClassName(row) : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-sm text-gray-700 ${col.className || ''}`}>
                    {col.render
                      ? col.render((row as any)[col.key], row)
                      : (row as any)[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-500">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm font-medium">{page}/{totalPages}</span>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
