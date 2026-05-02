'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { tesisSchema, TesisFormData } from '@/lib/utils/validations';
import Header from '@/components/layouts/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

export default function NuevaTesisPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: asesores } = useQuery({
    queryKey: ['asesores-select'],
    queryFn: async () => {
      const { data } = await apiClient.get('/asesores', { params: { limit: 100 } });
      return data.data.data;
    },
  });

  const { data: estudiantes } = useQuery({
    queryKey: ['estudiantes-select'],
    queryFn: async () => {
      const { data } = await apiClient.get('/estudiantes', { params: { limit: 100 } });
      return data.data.data;
    },
    enabled: user?.rol !== 'ESTUDIANTE',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TesisFormData>({ resolver: zodResolver(tesisSchema) });

  const onSubmit = async (formData: TesisFormData) => {
    try {
      await apiClient.post(ENDPOINTS.TESIS.BASE, {
        ...formData,
        asesorId: Number(formData.asesorId),
      });
      toast.success('Tesis registrada correctamente');
      router.push('/tesis');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al registrar tesis');
    }
  };

  return (
    <>
      <Header title="Nueva Tesis" />
      <div className="p-6 max-w-2xl">
        <Link href="/tesis" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-6">Registrar Tesis</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título de tesis</label>
              <input {...register('titulo')} className="input-field" placeholder="Desarrollo de sistema..." />
              {errors.titulo && <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resumen (opcional)</label>
              <textarea {...register('resumen')} className="input-field" rows={4} placeholder="Breve descripción de la investigación..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select {...register('tipo')} className="input-field">
                  <option value="PREGRADO">Pregrado</option>
                  <option value="POSGRADO">Posgrado</option>
                </select>
                {errors.tipo && <p className="mt-1 text-xs text-red-600">{errors.tipo.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                <input type="date" {...register('fechaInicio')} className="input-field" />
                {errors.fechaInicio && <p className="mt-1 text-xs text-red-600">{errors.fechaInicio.message}</p>}
              </div>
            </div>

            {user?.rol !== 'ESTUDIANTE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
                <select className="input-field">
                  <option value="">Seleccionar...</option>
                  {estudiantes?.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.usuario?.nombres} {e.usuario?.apellidos}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asesor</label>
              <select {...register('asesorId', { valueAsNumber: true })} className="input-field">
                <option value="">Seleccionar asesor...</option>
                {asesores?.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.usuario?.nombres} {a.usuario?.apellidos} — {a.especialidad}
                  </option>
                ))}
              </select>
              {errors.asesorId && <p className="mt-1 text-xs text-red-600">{errors.asesorId.message}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Guardando...' : 'Registrar tesis'}
              </button>
              <Link href="/tesis" className="btn-secondary">Cancelar</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
