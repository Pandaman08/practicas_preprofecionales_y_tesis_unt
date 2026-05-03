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
  dni: z.string().length(8, 'DNI debe tener 8 digitos'),
  especialidad: z.string().min(3, 'Especialidad requerida'),
  grado: z.string().min(2, 'Grado requerido'),
  telefono: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function AsesorCreateForm({ onSuccess, onCancel, onDirtyChange }: Props) {
  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const values = watch();

  const hasDraft = useMemo(() => {
    return Boolean(
      values.email?.trim() ||
      values.password?.trim() ||
      values.nombres?.trim() ||
      values.apellidos?.trim() ||
      values.dni?.trim() ||
      values.especialidad?.trim() ||
      values.grado?.trim() ||
      values.telefono?.trim(),
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
      await apiClient.post(ENDPOINTS.ASESORES.BASE, values);
      toast.success('Asesor creado correctamente');
      reset();
      onDirtyChange?.(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo crear el asesor');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Correo institucional</label>
          <input {...register('email')} className="input-field" placeholder="asesor@unt.edu.pe" />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña temporal</label>
          <input type="password" {...register('password')} className="input-field" placeholder="******" />
          {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">DNI</label>
          <input {...register('dni')} className="input-field" placeholder="12345678" />
          {errors.dni ? <p className="mt-1 text-xs text-red-600">{errors.dni.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombres</label>
          <input {...register('nombres')} className="input-field" placeholder="Ana" />
          {errors.nombres ? <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Apellidos</label>
          <input {...register('apellidos')} className="input-field" placeholder="Torres" />
          {errors.apellidos ? <p className="mt-1 text-xs text-red-600">{errors.apellidos.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Especialidad</label>
          <input {...register('especialidad')} className="input-field" placeholder="Ingenieria de Software" />
          {errors.especialidad ? <p className="mt-1 text-xs text-red-600">{errors.especialidad.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Grado academico</label>
          <input {...register('grado')} className="input-field" placeholder="Magister" />
          {errors.grado ? <p className="mt-1 text-xs text-red-600">{errors.grado.message}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Telefono (opcional)</label>
          <input {...register('telefono')} className="input-field" placeholder="999999999" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
          <UserPlus className="h-4 w-4" />
          {isSubmitting ? 'Creando...' : 'Crear asesor'}
        </button>
      </div>
    </form>
  );
}
