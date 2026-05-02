'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import Header from '@/components/layouts/Header';
import toast from 'react-hot-toast';

const schema = z.object({
  estudianteId: z.number().min(1, 'Selecciona un estudiante'),
  empresaId: z.number().min(1, 'Selecciona una empresa'),
  asesorId: z.number().optional(),
  fechaInicio: z.string().min(1, 'Requerido'),
  fechaFin: z.string().min(1, 'Requerido'),
  totalHoras: z.number().min(1, 'Requerido'),
  observaciones: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NuevaPracticaPage() {
  const router = useRouter();

  const { data: estudiantes } = useQuery({
    queryKey: ['estudiantes-select'],
    queryFn: async () => {
      const { data } = await apiClient.get('/estudiantes', { params: { limit: 100 } });
      return data.data.data;
    },
  });

  const { data: empresas } = useQuery({
    queryKey: ['empresas-select'],
    queryFn: async () => {
      const { data } = await apiClient.get('/empresas', { params: { limit: 100 } });
      return data.data.data;
    },
  });

  const { data: asesores } = useQuery({
    queryKey: ['asesores-select'],
    queryFn: async () => {
      const { data } = await apiClient.get('/asesores', { params: { limit: 100 } });
      return data.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (formData: FormData) => {
    try {
      await apiClient.post(ENDPOINTS.PRACTICAS.BASE, formData);
      toast.success('Práctica registrada correctamente');
      router.push('/practicas');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al registrar práctica');
    }
  };

  return (
    <>
      <Header title="Nueva Práctica" />
      <div className="p-6 max-w-2xl">
        <Link href="/practicas" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-6">Registrar Práctica Preprofesional</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
              <select
                {...register('estudianteId', { valueAsNumber: true })}
                className="input-field"
              >
                <option value="">Seleccionar...</option>
                {estudiantes?.map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.usuario?.nombres} {e.usuario?.apellidos} ({e.codigo})
                  </option>
                ))}
              </select>
              {errors.estudianteId && <p className="mt-1 text-xs text-red-600">{errors.estudianteId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select
                {...register('empresaId', { valueAsNumber: true })}
                className="input-field"
              >
                <option value="">Seleccionar...</option>
                {empresas?.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.razonSocial}</option>
                ))}
              </select>
              {errors.empresaId && <p className="mt-1 text-xs text-red-600">{errors.empresaId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asesor (opcional)</label>
              <select
                {...register('asesorId', { valueAsNumber: true })}
                className="input-field"
              >
                <option value="">Sin asesor</option>
                {asesores?.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.usuario?.nombres} {a.usuario?.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                <input type="date" {...register('fechaInicio')} className="input-field" />
                {errors.fechaInicio && <p className="mt-1 text-xs text-red-600">{errors.fechaInicio.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                <input type="date" {...register('fechaFin')} className="input-field" />
                {errors.fechaFin && <p className="mt-1 text-xs text-red-600">{errors.fechaFin.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total de horas</label>
              <input
                type="number"
                {...register('totalHoras', { valueAsNumber: true })}
                className="input-field"
                placeholder="240"
                min={1}
              />
              {errors.totalHoras && <p className="mt-1 text-xs text-red-600">{errors.totalHoras.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea {...register('observaciones')} className="input-field" rows={3} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Guardando...' : 'Registrar práctica'}
              </button>
              <Link href="/practicas" className="btn-secondary">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
