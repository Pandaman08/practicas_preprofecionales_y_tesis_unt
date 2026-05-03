'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Rol } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import SearchableEntitySelect, { SearchableEntityOption } from '@/components/ui/SearchableEntitySelect';

const schema = z.object({
  titulo: z.string().min(10, 'Titulo demasiado corto'),
  resumen: z.string().optional(),
  tipo: z.enum(['TESIS', 'TRABAJO_SUFICIENCIA', 'PROYECTO_INVESTIGACION']),
  estudianteId: z.number().optional(),
  asesorId: z.number({ required_error: 'Selecciona un asesor' }).min(1, 'Selecciona un asesor'),
  fechaInicio: z.string().min(1, 'Fecha de inicio requerida'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function TesisCreateForm({ onSuccess, onCancel, onDirtyChange }: Props) {
  const { user } = useAuth();
  const isStudent = user?.rol === Rol.ESTUDIANTE;

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
    defaultValues: { tipo: 'TESIS' },
  });

  const { data: asesores } = useQuery({
    queryKey: ['asesores-select'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.ASESORES.BASE, { params: { limit: 200, activo: true } });
      return data.data.data as Array<any>;
    },
  });

  const { data: estudiantes } = useQuery({
    queryKey: ['estudiantes-select'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.ESTUDIANTES.BASE, { params: { limit: 200, activo: true } });
      return data.data.data as Array<any>;
    },
    enabled: !isStudent,
  });

  const { data: miPerfil } = useQuery({
    queryKey: ['mi-estudiante-perfil'],
    queryFn: async () => {
      const { data } = await apiClient.get(ENDPOINTS.ESTUDIANTES.MI_PERFIL);
      return data.data as { id: number };
    },
    enabled: isStudent,
  });

  useEffect(() => {
    setFocus('titulo');
  }, [setFocus]);

  const estudianteId = watch('estudianteId');
  const asesorId = watch('asesorId');
  const titulo = watch('titulo');
  const resumen = watch('resumen');
  const tipo = watch('tipo');
  const fechaInicio = watch('fechaInicio');

  const estudiantesOptions = useMemo<SearchableEntityOption[]>(() => (
    (estudiantes || []).map((item) => ({
      value: item.id,
      title: `${item.nombres} ${item.apellidos}`,
      subtitle: [item.dni, item.codigo, item.usuario?.email].filter(Boolean).join(' • '),
      keywords: [item.nombres, item.apellidos, item.dni, item.codigo, item.usuario?.email].filter(Boolean),
    }))
  ), [estudiantes]);

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
      resumen?.trim() ||
      fechaInicio ||
      (estudianteId && estudianteId > 0) ||
      (asesorId && asesorId > 0) ||
      (tipo && tipo !== 'TESIS'),
    );
  }, [asesorId, estudianteId, fechaInicio, resumen, tipo, titulo]);

  useEffect(() => {
    onDirtyChange?.(hasDraft);
  }, [hasDraft, onDirtyChange]);

  const onSubmit = async (values: FormData) => {
    try {
      const estudianteId = isStudent ? miPerfil?.id : values.estudianteId;
      if (!estudianteId) {
        toast.error('Selecciona un estudiante');
        return;
      }

      await apiClient.post(ENDPOINTS.TESIS.BASE, {
        titulo: values.titulo,
        resumen: values.resumen,
        tipo: values.tipo,
        fechaInicio: new Date(values.fechaInicio).toISOString(),
        asesorId: Number(values.asesorId),
        estudianteId,
      });

      toast.success('Tesis creada correctamente');
      reset({ tipo: 'TESIS' });
      onDirtyChange?.(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo crear la tesis');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Titulo</label>
          <input {...register('titulo')} className="input-field" placeholder="Desarrollo de plataforma academica" />
          {errors.titulo ? <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Resumen (opcional)</label>
          <textarea {...register('resumen')} className="input-field" rows={3} placeholder="Descripcion breve" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
          <select {...register('tipo')} className="input-field">
            <option value="TESIS">Tesis</option>
            <option value="TRABAJO_SUFICIENCIA">Trabajo de suficiencia</option>
            <option value="PROYECTO_INVESTIGACION">Proyecto de investigacion</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de inicio</label>
          <input type="date" {...register('fechaInicio')} className="input-field" />
          {errors.fechaInicio ? <p className="mt-1 text-xs text-red-600">{errors.fechaInicio.message}</p> : null}
        </div>

        {!isStudent ? (
          <div className="sm:col-span-2">
            <SearchableEntitySelect
              label="Estudiante"
              placeholder="Buscar estudiante por nombre, DNI o codigo"
              searchPlaceholder="Escribe nombre, DNI, codigo o correo"
              emptyMessage="No se encontraron estudiantes con ese criterio."
              value={estudianteId}
              options={estudiantesOptions}
              onChange={(value) => setValue('estudianteId', value, { shouldDirty: true, shouldValidate: true })}
              error={errors.estudianteId?.message}
            />
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <SearchableEntitySelect
            label="Asesor"
            placeholder="Buscar asesor por nombre, DNI o especialidad"
            searchPlaceholder="Escribe nombre, DNI, especialidad o correo"
            emptyMessage="No se encontraron asesores con ese criterio."
            value={asesorId}
            options={asesoresOptions}
            onChange={(value) => setValue('asesorId', value || 0, { shouldDirty: true, shouldValidate: true })}
            error={errors.asesorId?.message}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
          <BookOpen className="h-4 w-4" />
          {isSubmitting ? 'Creando...' : 'Crear tesis'}
        </button>
      </div>
    </form>
  );
}
