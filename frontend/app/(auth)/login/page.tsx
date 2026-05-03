'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff, GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { loginSchema, LoginFormData } from '@/lib/utils/validations';
import toast from 'react-hot-toast';

const TEST_PASSWORDS = {
  admin: ['admin', '123'].join(''),
  coordinador: ['coord', '123'].join(''),
  asesor: ['asesor', '123'].join(''),
  estudiante: ['estud', '123'].join(''),
  empresa: ['empresa', '123'].join(''),
} as const;

const TEST_CREDENTIALS = [
  { role: 'ADMIN', email: 'admin@unt.edu.pe', password: TEST_PASSWORDS.admin },
  { role: 'COORDINADOR', email: 'coordinador@unt.edu.pe', password: TEST_PASSWORDS.coordinador },
  { role: 'ASESOR', email: 'asesor1@unt.edu.pe', password: TEST_PASSWORDS.asesor },
  { role: 'ESTUDIANTE', email: 'estudiante1@unt.edu.pe', password: TEST_PASSWORDS.estudiante },
  { role: 'EMPRESA', email: 'empresa1@demo.pe', password: TEST_PASSWORDS.empresa },
] as const;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Credenciales incorrectas');
    }
  };

  const inputBaseClass =
    'w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition';

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  const applyCredential = (email: string, password: string, role: string) => {
    setValue('email', email, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setValue('password', password, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    toast.success(`Credenciales ${role} cargadas`);
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-10 text-white lg:flex lg:flex-col lg:gap-8">
          <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
              <GraduationCap className="h-5 w-5 text-amber-300" />
              <span className="text-sm font-medium tracking-wide">Universidad Nacional de Trujillo</span>
            </div>

            <h2 className="mt-8 max-w-md text-4xl font-semibold leading-tight">
              Sistema de Practicas y Tesis
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-200">
              Plataforma academica para el seguimiento institucional de practicas preprofesionales y proyectos de tesis.
            </p>
          </div>

          <aside className="relative z-10 max-w-md rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">Credenciales de prueba</h3>
              <span className="text-xs text-slate-200">Seed local</span>
            </div>

            <div className="max-h-[34vh] space-y-2 overflow-auto pr-1">
              {TEST_CREDENTIALS.map((item) => (
                <div key={item.role} className="rounded-xl border border-white/20 bg-slate-900/20 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold tracking-wide text-slate-100">{item.role}</p>
                    <button
                      type="button"
                      onClick={() => applyCredential(item.email, item.password, item.role)}
                      className="rounded-md border border-blue-200/50 bg-blue-100/90 px-2 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-50"
                    >
                      Usar
                    </button>
                  </div>
                  <p className="text-xs text-slate-200">
                    <span className="font-medium">Correo:</span> {item.email}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-200">
                    <span className="font-medium">Clave:</span> {item.password}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.email, `Correo ${item.role}`)}
                      className="rounded-md bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-800 hover:bg-blue-50"
                    >
                      Copiar correo
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.password, `Clave ${item.role}`)}
                      className="rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-50"
                    >
                      Copiar clave
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="relative z-10 mt-auto space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <BookOpen className="mt-0.5 h-5 w-5 text-blue-200" />
              <p className="text-sm text-slate-100">Gestion centralizada para estudiantes, asesores, coordinadores y empresas.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-200" />
              <p className="text-sm text-slate-100">Acceso seguro y trazabilidad de procesos academicos por rol institucional.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
                <BookOpen className="h-8 w-8 text-blue-700" />
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">Iniciar sesion</h1>
              <p className="mt-2 text-sm text-slate-500">Ingresa con tu cuenta institucional para continuar.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="usuario@unt.edu.pe"
                  aria-invalid={!!errors.email}
                  className={`${inputBaseClass} ${
                    errors.email
                      ? 'border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-4 focus:ring-red-100'
                      : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Contraseña
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="********"
                    aria-invalid={!!errors.password}
                    className={`${inputBaseClass} pr-11 ${
                      errors.password
                        ? 'border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-4 focus:ring-red-100'
                        : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    <span>Validando credenciales...</span>
                  </span>
                ) : (
                  'Iniciar sesion'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="font-semibold text-blue-700 transition hover:text-blue-800 hover:underline">
                Crear cuenta
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}