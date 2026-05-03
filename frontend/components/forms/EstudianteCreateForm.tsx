'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  nombres: z.string().min(2, 'Nombres requeridos'),
  apellidos: z.string().min(2, 'Apellidos requeridos'),
  codigo: z.string().min(5, 'Codigo requerido'),
  dni: z.string().length(8, 'DNI debe tener 8 digitos'),
  ciclo: z.number().min(1, 'Ciclo minimo 1').max(12, 'Ciclo maximo 12'),
  especialidad: z.string().min(3, 'Especialidad requerida'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function EstudianteCreateForm({ onSuccess, onCancel, onDirtyChange }: Readonly<Props>) {
  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ciclo: 1 },
  });

  const values = watch();

  const hasDraft = useMemo(() => {
    return Boolean(
      values.email?.trim() ||
      values.password?.trim() ||
      values.nombres?.trim() ||
      values.apellidos?.trim() ||
      values.codigo?.trim() ||
      values.dni?.trim() ||
      values.especialidad?.trim() ||
      values.telefono?.trim() ||
      values.direccion?.trim() ||
      (values.ciclo && values.ciclo !== 1),
    );
  }, [values]);

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  useEffect(() => {
    onDirtyChange?.(hasDraft);
  }, [hasDraft, onDirtyChange]);

  const onSubmit = async (values: FormData) => {
    try {
      await apiClient.post(ENDPOINTS.ESTUDIANTES.BASE, values);
      toast.success('Estudiante creado correctamente');
      reset();
      onDirtyChange?.(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo crear el estudiante');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="create-est-email" className="mb-1 block text-sm font-medium text-slate-700">Correo institucional</label>
          <input id="create-est-email" {...register('email')} className="input-field" placeholder="estudiante@unt.edu.pe" />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <label htmlFor="create-est-password" className="mb-1 block text-sm font-medium text-slate-700">Contraseña temporal</label>
          <input id="create-est-password" type="password" {...register('password')} className="input-field" placeholder="******" />
          {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
        </div>

        <div>
          <label htmlFor="create-est-codigo" className="mb-1 block text-sm font-medium text-slate-700">Codigo</label>
          <input id="create-est-codigo" {...register('codigo')} className="input-field" placeholder="202012345" />
          {errors.codigo ? <p className="mt-1 text-xs text-red-600">{errors.codigo.message}</p> : null}
        </div>

        <div>
          <label htmlFor="create-est-nombres" className="mb-1 block text-sm font-medium text-slate-700">Nombres</label>
          <input id="create-est-nombres" {...register('nombres')} className="input-field" placeholder="Juan" />
          {errors.nombres ? <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p> : null}
        </div>

        <div>
          <label htmlFor="create-est-apellidos" className="mb-1 block text-sm font-medium text-slate-700">Apellidos</label>
          <input id="create-est-apellidos" {...register('apellidos')} className="input-field" placeholder="Perez" />
          {errors.apellidos ? <p className="mt-1 text-xs text-red-600">{errors.apellidos.message}</p> : null}
        </div>

        <div>
          <label htmlFor="create-est-dni" className="mb-1 block text-sm font-medium text-slate-700">DNI</label>
          <input id="create-est-dni" {...register('dni')} className="input-field" placeholder="12345678" />
          {errors.dni ? <p className="mt-1 text-xs text-red-600">{errors.dni.message}</p> : null}
        </div>

        <div>
          <label htmlFor="create-est-ciclo" className="mb-1 block text-sm font-medium text-slate-700">Ciclo</label>
          <input id="create-est-ciclo" type="number" min={1} max={12} {...register('ciclo', { valueAsNumber: true })} className="input-field" />
          {errors.ciclo ? <p className="mt-1 text-xs text-red-600">{errors.ciclo.message}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="create-est-especialidad" className="mb-1 block text-sm font-medium text-slate-700">Especialidad</label>
          <input id="create-est-especialidad" {...register('especialidad')} className="input-field" placeholder="Ingenieria de Sistemas" />
          {errors.especialidad ? <p className="mt-1 text-xs text-red-600">{errors.especialidad.message}</p> : null}
        </div>

        <div>
          <label htmlFor="create-est-telefono" className="mb-1 block text-sm font-medium text-slate-700">Telefono (opcional)</label>
          <input id="create-est-telefono" {...register('telefono')} className="input-field" placeholder="999999999" />
        </div>

        <div>
          <label htmlFor="create-est-direccion" className="mb-1 block text-sm font-medium text-slate-700">Direccion (opcional)</label>
          <input id="create-est-direccion" {...register('direccion')} className="input-field" placeholder="Av. Universidad" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
          <UserPlus className="h-4 w-4" />
          {isSubmitting ? 'Creando...' : 'Crear estudiante'}
        </button>
      </div>
    </form>
  );
}
