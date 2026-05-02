'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ofertaSchema, OfertaFormData } from '@/lib/utils/validations';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

interface OfertaFormProps {
  defaultValues?: Partial<OfertaFormData>;
  ofertaId?: number;
}

export default function OfertaForm({ defaultValues, ofertaId }: OfertaFormProps) {
  const router = useRouter();

  const { data: empresas } = useQuery({
    queryKey: ['empresas-select'],
    queryFn: async () => {
      const { data } = await apiClient.get('/empresas', { params: { limit: 100 } });
      return data.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OfertaFormData>({
    resolver: zodResolver(ofertaSchema),
    defaultValues,
  });

  const onSubmit = async (data: OfertaFormData) => {
    try {
      if (ofertaId) {
        await apiClient.patch(`${ENDPOINTS.OFERTAS.BASE}/${ofertaId}`, data);
        toast.success('Oferta actualizada');
      } else {
        await apiClient.post(ENDPOINTS.OFERTAS.BASE, data);
        toast.success('Oferta creada correctamente');
      }
      router.push('/practicas');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar oferta');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input {...register('titulo')} className="input-field" placeholder="Practicante de desarrollo..." />
        {errors.titulo && <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea {...register('descripcion')} className="input-field" rows={3} placeholder="Descripción del puesto..." />
        {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
        <select {...register('empresaId', { valueAsNumber: true })} className="input-field">
          <option value="">Seleccionar empresa...</option>
          {empresas?.map((e: any) => (
            <option key={e.id} value={e.id}>{e.razonSocial}</option>
          ))}
        </select>
        {errors.empresaId && <p className="mt-1 text-xs text-red-600">{errors.empresaId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
          <select {...register('modalidad')} className="input-field">
            <option value="PRESENCIAL">Presencial</option>
            <option value="REMOTO">Remoto</option>
            <option value="HIBRIDO">Híbrido</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vacantes</label>
          <input type="number" {...register('vacantes', { valueAsNumber: true })} className="input-field" min={1} />
          {errors.vacantes && <p className="mt-1 text-xs text-red-600">{errors.vacantes.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horas/semana</label>
          <input type="number" {...register('horasSemana', { valueAsNumber: true })} className="input-field" min={1} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remuneración (S/.)</label>
          <input type="number" {...register('remuneracion', { valueAsNumber: true })} className="input-field" min={0} step="0.01" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
        <input type="date" {...register('fechaLimite')} className="input-field" />
        {errors.fechaLimite && <p className="mt-1 text-xs text-red-600">{errors.fechaLimite.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Requisitos</label>
        <textarea {...register('requisitos')} className="input-field" rows={3} placeholder="Conocimientos requeridos..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Guardando...' : ofertaId ? 'Actualizar oferta' : 'Crear oferta'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
