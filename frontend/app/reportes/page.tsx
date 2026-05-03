'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Header from '@/components/layouts/Header';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { formatDate } from '@/lib/utils/formatDate';

type ReportType = 'practicas' | 'tesis' | 'empresas';

function normalizeRows(tipo: ReportType, payload: any) {
  if (tipo === 'practicas') return payload?.practicas ?? [];
  if (tipo === 'tesis') return payload?.tesis ?? [];
  return payload?.empresas ?? [];
}

export default function ReportesPage() {
  const [tipo, setTipo] = useState<ReportType>('practicas');
  const [estado, setEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoTesis, setTipoTesis] = useState('');

  const endpointMap: Record<ReportType, string> = {
    practicas: ENDPOINTS.REPORTES.PRACTICAS,
    tesis: ENDPOINTS.REPORTES.TESIS,
    empresas: ENDPOINTS.REPORTES.EMPRESAS,
  };

  const csvMap: Record<ReportType, string> = {
    practicas: `${ENDPOINTS.REPORTES.PRACTICAS}/download`,
    tesis: `${ENDPOINTS.REPORTES.TESIS}/download`,
    empresas: `${ENDPOINTS.REPORTES.EMPRESAS}/download`,
  };

  const params = useMemo(() => ({
    estado: estado || undefined,
    fechaInicio: fechaInicio || undefined,
    fechaFin: fechaFin || undefined,
    tipo: tipoTesis || undefined,
  }), [estado, fechaInicio, fechaFin, tipoTesis]);

  const { data, isLoading } = useQuery({
    queryKey: ['reportes-admin', tipo, params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: any }>(endpointMap[tipo], { params });
      return data.data;
    },
  });

  const rows = useMemo(() => normalizeRows(tipo, data), [tipo, data]);

  const buildFilename = (extension: 'csv' | 'xlsx' | 'pdf') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `reporte_${tipo}_${timestamp}.${extension}`;
  };

  const exportCsv = async () => {
    const response = await apiClient.get(csvMap[tipo], { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', buildFilename('csv'));
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const exportRows = rows.map((row: any) => {
      if (tipo === 'practicas') {
        return {
          ID: row.id,
          Estado: row.estado,
          Estudiante: `${row.estudiante?.nombres ?? ''} ${row.estudiante?.apellidos ?? ''}`.trim(),
          Empresa: row.empresa?.razonSocial,
          'Fecha inicio': row.fechaInicio ? formatDate(row.fechaInicio) : '',
          'Fecha fin': row.fechaFin ? formatDate(row.fechaFin) : '',
          Horas: row.horasTotales,
        };
      }

      if (tipo === 'tesis') {
        return {
          ID: row.id,
          Estado: row.estado,
          Tipo: row.tipo,
          Titulo: row.titulo,
          Estudiante: `${row.estudiante?.nombres ?? ''} ${row.estudiante?.apellidos ?? ''}`.trim(),
          Asesor: row.asesor ? `${row.asesor.nombres} ${row.asesor.apellidos}` : '',
        };
      }

      return {
        ID: row.id,
        Empresa: row.razonSocial,
        RUC: row.ruc,
        Sector: row.sector,
        Contacto: row.contactoNombre,
        Email: row.contactoEmail,
        Ofertas: row._count?.ofertas ?? 0,
        Convenios: row._count?.convenios ?? 0,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const cols: Array<{ wch: number }> = [];
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      let maxLength = 10;
      for (let rowIdx = range.s.r; rowIdx <= range.e.r; rowIdx += 1) {
        const cell = worksheet[XLSX.utils.encode_cell({ c: col, r: rowIdx })];
        const value = cell ? String(cell.v ?? '') : '';
        maxLength = Math.max(maxLength, value.length + 2);
      }
      cols.push({ wch: Math.min(maxLength, 48) });
    }
    worksheet['!cols'] = cols;

    XLSX.writeFile(workbook, buildFilename('xlsx'));
  };

  const exportPdf = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('Universidad Nacional de Trujillo', 14, 14);
    doc.setFontSize(11);
    doc.text('Sistema de Practicas y Tesis - Reporte Institucional', 14, 21);
    doc.text(`Tipo de reporte: ${tipo.toUpperCase()}`, 14, 28);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 34);

    const body = rows.map((row: any) => {
      if (tipo === 'practicas') {
        return [
          row.id,
          row.estado,
          `${row.estudiante?.nombres ?? ''} ${row.estudiante?.apellidos ?? ''}`.trim(),
          row.empresa?.razonSocial ?? '-',
          row.fechaInicio ? formatDate(row.fechaInicio) : '-',
          row.fechaFin ? formatDate(row.fechaFin) : '-',
        ];
      }
      if (tipo === 'tesis') {
        return [
          row.id,
          row.estado,
          row.tipo,
          row.titulo,
          `${row.estudiante?.nombres ?? ''} ${row.estudiante?.apellidos ?? ''}`.trim(),
        ];
      }
      return [
        row.id,
        row.razonSocial,
        row.ruc,
        row.sector ?? '-',
        row.contactoNombre ?? '-',
        row._count?.ofertas ?? 0,
      ];
    });

    const head =
      tipo === 'practicas'
        ? [['ID', 'Estado', 'Estudiante', 'Empresa', 'Inicio', 'Fin']]
        : tipo === 'tesis'
          ? [['ID', 'Estado', 'Tipo', 'Titulo', 'Estudiante']]
          : [['ID', 'Empresa', 'RUC', 'Sector', 'Contacto', 'Ofertas']];

    autoTable(doc, {
      startY: 40,
      head,
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    doc.save(buildFilename('pdf'));
  };

  return (
    <>
      <Header title="Reportes" />
      <div className="h-[calc(100vh-73px)] overflow-hidden bg-slate-50 p-4 sm:p-6">
        <div className="flex h-full flex-col gap-5">
        <section className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            {(['practicas', 'tesis', 'empresas'] as ReportType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setTipo(tab)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  tipo === tab
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button onClick={exportCsv} className="btn-secondary inline-flex items-center gap-2 text-xs">
                <Download className="h-4 w-4" /> CSV
              </button>
              <button onClick={exportExcel} className="btn-secondary inline-flex items-center gap-2 text-xs">
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </button>
              <button onClick={exportPdf} className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-xs">
                <FileText className="h-4 w-4" /> PDF
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="input-field pl-9"
                placeholder="Estado"
              />
            </div>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="input-field"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="input-field"
            />
            <input
              value={tipoTesis}
              onChange={(e) => setTipoTesis(e.target.value)}
              className="input-field"
              placeholder="Tipo tesis"
            />
            <button
              type="button"
              onClick={() => {
                setEstado('');
                setFechaInicio('');
                setFechaFin('');
                setTipoTesis('');
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        <section className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Vista previa del reporte</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {rows.length} registros
            </span>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-500">Cargando reporte...</div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hay resultados para los filtros actuales.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {Object.keys(rows[0]).slice(0, 7).map((key) => (
                      <th key={key} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.slice(0, 20).map((row: any, idx: number) => (
                    <tr key={row.id ?? idx}>
                      {Object.keys(rows[0]).slice(0, 7).map((key) => (
                        <td key={key} className="px-3 py-2 text-xs text-slate-700">
                          {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] ?? '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </div>
      </div>
    </>
  );
}
