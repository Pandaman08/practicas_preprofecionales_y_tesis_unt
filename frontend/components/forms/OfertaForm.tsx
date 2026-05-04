'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ofertaSchema, OfertaFormData } from '@/lib/utils/validations';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Rol } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import SearchableEntitySelect, { SearchableEntityOption } from '@/components/ui/SearchableEntitySelect';

interface OfertaFormProps {
  defaultValues?: Partial<OfertaFormData>;
  ofertaId?: number;
}

export default function OfertaForm({ defaultValues, ofertaId }: OfertaFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isCompany = user?.rol === Rol.EMPRESA;

  const { data: empresas } = useQuery({
    queryKey: ['empresas-select'],
    queryFn: async () => {
      const { data } = await apiClient.get('/empresas', { params: { limit: 200, activo: true } });
      return data.data.data;
    },
    enabled: !isCompany,
  });

  const { data: miEmpresa } = useQuery({
    queryKey: ['mi-empresa-oferta'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.EMPRESAS.MI_PERFIL);
      return data.data as { id: number; razonSocial: string; ruc?: string };
    },
    enabled: isCompany,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OfertaFormData>({
    resolver: zodResolver(ofertaSchema),
    defaultValues,
  });

  const empresaId = watch('empresaId');

  const empresasOptions = useMemo<SearchableEntityOption[]>(() => (
    (empresas || []).map((item: any) => ({
      value: item.id,
      title: item.razonSocial,
      subtitle: [item.ruc, item.contactoNombre, item.usuario?.email].filter(Boolean).join(' • '),
      keywords: [item.razonSocial, item.ruc, item.contactoNombre, item.usuario?.email].filter(Boolean),
    }))
  ), [empresas]);

  useEffect(() => {
    if (isCompany && miEmpresa?.id && empresaId !== miEmpresa.id) {
      setValue('empresaId', miEmpresa.id, { shouldValidate: true });
    }
  }, [empresaId, isCompany, miEmpresa?.id, setValue]);

  const onSubmit = async (data: OfertaFormData) => {
    try {
      if (ofertaId) {
        await apiClient.put(`${ENDPOINTS.OFERTAS.BASE}/${ofertaId}`, data);
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

      {isCompany ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          La oferta se publicara automaticamente con tu empresa.
        </div>
      ) : (
        <SearchableEntitySelect
          label="Empresa"
          placeholder="Buscar empresa por razon social o RUC"
          searchPlaceholder="Escribe razon social, RUC o correo"
          emptyMessage="No se encontraron empresas con ese criterio."
          value={empresaId}
          options={empresasOptions}
          onChange={(value) => setValue('empresaId', value || 0, { shouldDirty: true, shouldValidate: true })}
          error={errors.empresaId?.message}
        />
      )}

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
