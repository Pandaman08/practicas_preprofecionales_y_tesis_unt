'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff, GraduationCap, Sparkles } from 'lucide-react';
import { registerSchema, RegisterFormData } from '@/lib/utils/validations';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await apiClient.post(ENDPOINTS.AUTH.REGISTER, {
        ...data,
        rol: 'ESTUDIANTE',
        ciclo: Number(data.ciclo),
      });
      toast.success('Cuenta creada. Ya puedes iniciar sesión.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al registrarse');
    }
  };

  const inputBaseClass =
    'w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition';

  const inputClasses = (hasError: boolean) =>
    `${inputBaseClass} ${
      hasError
        ? 'border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-4 focus:ring-red-100'
        : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
    }`;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
              <GraduationCap className="h-5 w-5 text-amber-300" />
              <span className="text-sm font-medium tracking-wide">Plataforma Academica UNT</span>
            </div>

            <h2 className="mt-8 max-w-md text-4xl font-semibold leading-tight">
              Crea tu cuenta institucional
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-200">
              Registro exclusivo para estudiantes UNT para gestionar practicas preprofesionales y avances de tesis.
            </p>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <p className="text-sm font-medium">Recomendaciones de registro</p>
            </div>
            <ul className="space-y-2 text-sm text-slate-100">
              <li>Usa tu correo institucional (@unt.edu.pe).</li>
              <li>Verifica que tu codigo UNT y DNI sean correctos.</li>
              <li>Completa especialidad y ciclo para personalizar el seguimiento.</li>
            </ul>
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
                <BookOpen className="h-8 w-8 text-blue-700" />
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">Crear cuenta</h1>
              <p className="mt-2 text-sm text-slate-500">Registro de estudiantes para el Sistema de Practicas y Tesis</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombres</label>
              <input {...register('nombres')} className={inputClasses(!!errors.nombres)} placeholder="Juan Carlos" aria-invalid={!!errors.nombres} />
              {errors.nombres && <p className="mt-1.5 text-xs text-red-600">{errors.nombres.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Apellidos</label>
              <input {...register('apellidos')} className={inputClasses(!!errors.apellidos)} placeholder="Perez Garcia" aria-invalid={!!errors.apellidos} />
              {errors.apellidos && <p className="mt-1.5 text-xs text-red-600">{errors.apellidos.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email institucional</label>
            <input type="email" {...register('email')} className={inputClasses(!!errors.email)} placeholder="usuario@unt.edu.pe" aria-invalid={!!errors.email} />
            {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`${inputClasses(!!errors.password)} pr-11`}
                placeholder="********"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Codigo UNT</label>
              <input {...register('codigo')} className={inputClasses(!!errors.codigo)} placeholder="720001234" aria-invalid={!!errors.codigo} />
              {errors.codigo && <p className="mt-1.5 text-xs text-red-600">{errors.codigo.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">DNI</label>
              <input {...register('dni')} className={inputClasses(!!errors.dni)} placeholder="12345678" maxLength={8} aria-invalid={!!errors.dni} />
              {errors.dni && <p className="mt-1.5 text-xs text-red-600">{errors.dni.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Especialidad</label>
              <input {...register('especialidad')} className={inputClasses(!!errors.especialidad)} placeholder="Ingenieria de Sistemas" aria-invalid={!!errors.especialidad} />
              {errors.especialidad && <p className="mt-1.5 text-xs text-red-600">{errors.especialidad.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Ciclo</label>
              <input
                type="number"
                {...register('ciclo', { valueAsNumber: true })}
                className={inputClasses(!!errors.ciclo)}
                placeholder="8"
                min={1}
                max={12}
                aria-invalid={!!errors.ciclo}
              />
              {errors.ciclo && <p className="mt-1.5 text-xs text-red-600">{errors.ciclo.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creando cuenta...
              </span>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>
      
        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-blue-700 transition hover:text-blue-800 hover:underline">
            Iniciar sesión
          </Link>
        </p>

      </div>
        </section>
      </div>
    </main>
  );
}
