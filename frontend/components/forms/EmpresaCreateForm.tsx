'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  razonSocial: z.string().min(2, 'Razon social requerida'),
  ruc: z.string().min(11, 'RUC invalido').max(11, 'RUC invalido'),
  sector: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  contactoNombre: z.string().optional(),
  contactoEmail: z.string().email('Email de contacto invalido').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function EmpresaCreateForm({ onSuccess, onCancel, onDirtyChange }: Props) {
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
      values.razonSocial?.trim() ||
      values.ruc?.trim() ||
      values.sector?.trim() ||
      values.direccion?.trim() ||
      values.telefono?.trim() ||
      values.contactoNombre?.trim() ||
      values.contactoEmail?.trim(),
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
      await apiClient.post(ENDPOINTS.EMPRESAS.BASE, values);
      toast.success('Empresa creada correctamente');
      reset();
      onDirtyChange?.(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo crear la empresa');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Correo empresarial</label>
          <input {...register('email')} className="input-field" placeholder="empresa@demo.pe" />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña temporal</label>
          <input type="password" {...register('password')} className="input-field" placeholder="******" />
          {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">RUC</label>
          <input {...register('ruc')} className="input-field" placeholder="20123456789" />
          {errors.ruc ? <p className="mt-1 text-xs text-red-600">{errors.ruc.message}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Razon social</label>
          <input {...register('razonSocial')} className="input-field" placeholder="Empresa SAC" />
          {errors.razonSocial ? <p className="mt-1 text-xs text-red-600">{errors.razonSocial.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Sector</label>
          <input {...register('sector')} className="input-field" placeholder="Tecnologia" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Telefono</label>
          <input {...register('telefono')} className="input-field" placeholder="044123456" />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Direccion</label>
          <input {...register('direccion')} className="input-field" placeholder="Av. Industrial 123" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Contacto</label>
          <input {...register('contactoNombre')} className="input-field" placeholder="Maria Lopez" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email de contacto</label>
          <input {...register('contactoEmail')} className="input-field" placeholder="contacto@empresa.pe" />
          {errors.contactoEmail ? <p className="mt-1 text-xs text-red-600">{errors.contactoEmail.message}</p> : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
          <Building2 className="h-4 w-4" />
          {isSubmitting ? 'Creando...' : 'Crear empresa'}
        </button>
      </div>
    </form>
  );
}
