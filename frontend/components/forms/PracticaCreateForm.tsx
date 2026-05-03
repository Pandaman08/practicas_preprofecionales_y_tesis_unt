'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Rol } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import SearchableEntitySelect, { SearchableEntityOption } from '@/components/ui/SearchableEntitySelect';

const schema = z.object({
  titulo: z.string().min(4, 'Titulo requerido'),
  estudianteId: z.number({ required_error: 'Selecciona estudiante' }).min(1, 'Selecciona estudiante'),
  empresaId: z.number({ required_error: 'Selecciona empresa' }).min(1, 'Selecciona empresa'),
  asesorId: z.number().optional(),
  fechaInicio: z.string().min(1, 'Fecha de inicio requerida'),
  fechaFin: z.string().optional(),
  horasTotales: z.number().min(1, 'Minimo 1 hora'),
  observaciones: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function PracticaCreateForm({ onSuccess, onCancel, onDirtyChange }: Props) {
  const { user } = useAuth();
  const isAdvisor = user?.rol === Rol.ASESOR;

  const {
    register,
    handleSubmit,
    setFocus,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { horasTotales: 240 },
  });

  const { data: estudiantes } = useQuery({
    queryKey: ['estudiantes-select'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.ESTUDIANTES.BASE, { params: { limit: 200, activo: true } });
      return data.data.data as Array<any>;
    },
  });

  const { data: empresas } = useQuery({
    queryKey: ['empresas-select'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.EMPRESAS.BASE, { params: { limit: 200, activo: true } });
      return data.data.data as Array<any>;
    },
  });

  const { data: asesores } = useQuery({
    queryKey: ['asesores-select'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.ASESORES.BASE, { params: { limit: 200, activo: true } });
      return data.data.data as Array<any>;
    },
    enabled: !isAdvisor,
  });

  const { data: miPerfil } = useQuery({
    queryKey: ['mi-asesor-perfil'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.ASESORES.MI_PERFIL);
      return data.data as { id: number; nombres: string; apellidos: string; especialidad?: string };
    },
    enabled: isAdvisor,
  });

  const estudianteId = watch('estudianteId');
  const empresaId = watch('empresaId');
  const asesorId = watch('asesorId');
  const titulo = watch('titulo');
  const fechaInicio = watch('fechaInicio');
  const fechaFin = watch('fechaFin');
  const horasTotales = watch('horasTotales');
  const observaciones = watch('observaciones');

  const estudiantesOptions = useMemo<SearchableEntityOption[]>(() => (
    (estudiantes || []).map((item) => ({
      value: item.id,
      title: `${item.nombres} ${item.apellidos}`,
      subtitle: [item.dni, item.codigo, item.usuario?.email].filter(Boolean).join(' • '),
      keywords: [item.nombres, item.apellidos, item.dni, item.codigo, item.usuario?.email].filter(Boolean),
    }))
  ), [estudiantes]);

  const empresasOptions = useMemo<SearchableEntityOption[]>(() => (
    (empresas || []).map((item) => ({
      value: item.id,
      title: item.razonSocial,
      subtitle: [item.ruc, item.contactoNombre, item.usuario?.email].filter(Boolean).join(' • '),
      keywords: [item.razonSocial, item.ruc, item.contactoNombre, item.usuario?.email].filter(Boolean),
    }))
  ), [empresas]);

  const asesoresOptions = useMemo<SearchableEntityOption[]>(() => (
    (asesores || []).map((item) => ({
      value: item.id,
      title: `${item.nombres} ${item.apellidos}`,
      subtitle: [item.dni, item.especialidad, item.usuario?.email].filter(Boolean).join(' • '),
      keywords: [item.nombres, item.apellidos, item.dni, item.especialidad, item.usuario?.email].filter(Boolean),
    }))
  ), [asesores]);

  const hasDraft = useMemo(() => {
    return Boolean(
      titulo?.trim() ||
      (estudianteId && estudianteId > 0) ||
      (empresaId && empresaId > 0) ||
      (asesorId && asesorId > 0) ||
      fechaInicio ||
      fechaFin ||
      (horasTotales && horasTotales !== 240) ||
      observaciones?.trim(),
    );
  }, [asesorId, empresaId, estudianteId, fechaFin, fechaInicio, horasTotales, observaciones, titulo]);

  useEffect(() => {
    setFocus('titulo');
  }, [setFocus]);

  useEffect(() => {
    onDirtyChange?.(hasDraft);
  }, [hasDraft, onDirtyChange]);

  const onSubmit = async (values: FormData) => {
    try {
      const resolvedAsesorId = isAdvisor ? miPerfil?.id : values.asesorId;
      if (isAdvisor && !resolvedAsesorId) {
        toast.error('No se pudo resolver el perfil del asesor logueado');
        return;
      }

      await apiClient.post(ENDPOINTS.PRACTICAS.BASE, {
        ...values,
        asesorId: resolvedAsesorId,
        fechaInicio: new Date(values.fechaInicio).toISOString(),
        fechaFin: values.fechaFin ? new Date(values.fechaFin).toISOString() : null,
      });
      toast.success('Practica creada correctamente');
      reset();
      onDirtyChange?.(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo crear la practica');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Titulo</label>
          <input {...register('titulo')} className="input-field" placeholder="Practica en desarrollo web" />
          {errors.titulo ? <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p> : null}
        </div>

        <SearchableEntitySelect
          label="Estudiante"
          placeholder="Nombre, DNI o codigo"
          searchPlaceholder="Nombre, DNI, codigo o correo"
          emptyMessage="No se encontraron estudiantes con ese criterio."
          value={estudianteId}
          options={estudiantesOptions}
          onChange={(value) => setValue('estudianteId', value || 0, { shouldDirty: true, shouldValidate: true })}
          error={errors.estudianteId?.message}
        />

        <SearchableEntitySelect
          label="Empresa"
          placeholder="Razon social o RUC"
          searchPlaceholder="Razon social, RUC o correo"
          emptyMessage="No se encontraron empresas con ese criterio."
          value={empresaId}
          options={empresasOptions}
          onChange={(value) => setValue('empresaId', value || 0, { shouldDirty: true, shouldValidate: true })}
          error={errors.empresaId?.message}
        />

        {isAdvisor ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 sm:col-span-2">
            Esta practica se vinculara automaticamente con tu perfil de asesor.
          </div>
        ) : (
          <SearchableEntitySelect
            label="Asesor (opcional)"
            placeholder="Asignar asesor por nombre o DNI"
            searchPlaceholder="Escribe nombre, DNI, especialidad o correo"
            emptyMessage="No se encontraron asesores con ese criterio."
            value={asesorId}
            options={asesoresOptions}
            onChange={(value) => setValue('asesorId', value, { shouldDirty: true, shouldValidate: true })}
            allowClear
            helperText="Puedes dejarlo sin asesor asignado."
          />
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Horas totales</label>
          <input type="number" min={1} {...register('horasTotales', { valueAsNumber: true })} className="input-field" />
          {errors.horasTotales ? <p className="mt-1 text-xs text-red-600">{errors.horasTotales.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de inicio</label>
          <input type="date" {...register('fechaInicio')} className="input-field" />
          {errors.fechaInicio ? <p className="mt-1 text-xs text-red-600">{errors.fechaInicio.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de fin (opcional)</label>
          <input type="date" {...register('fechaFin')} className="input-field" />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones</label>
          <textarea {...register('observaciones')} className="input-field" rows={3} placeholder="Notas del registro" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
          <Briefcase className="h-4 w-4" />
          {isSubmitting ? 'Creando...' : 'Crear practica'}
        </button>
      </div>
    </form>
  );
}
