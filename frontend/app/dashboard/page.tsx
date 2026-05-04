'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Briefcase,
  GraduationCap,
  Layers,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Header from '@/components/layouts/Header';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { DashboardAdminAnalytics, DashboardResumen, KpiItem, Rol, Usuario } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDate } from '@/lib/utils/formatDate';

function formatShortLabel(value: string, maxLength = 16) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function renderPiePercentLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) {
  if (!percent || percent < 0.08) return null;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

function getRoleInsight(role: Rol | undefined) {
  switch (role) {
    case Rol.COORDINADOR:
      return {
        title: 'Foco de coordinacion',
        subtitle: 'Prioriza carga academica y avance operativo general.',
        keywords: ['postul', 'practic', 'tesis', 'estudiant', 'asesor', 'empresa'],
      };
    case Rol.ASESOR:
      return {
        title: 'Foco de asesoria',
        subtitle: 'Destaca avance de tesistas y estado de practicas asignadas.',
        keywords: ['avance', 'seguim', 'tesis', 'practic', 'observ', 'sustent'],
      };
    case Rol.ESTUDIANTE:
      return {
        title: 'Foco del estudiante',
        subtitle: 'Muestra progreso personal, postulaciones y carga academica activa.',
        keywords: ['avance', 'practic', 'tesis', 'postul', 'curso', 'complet'],
      };
    case Rol.EMPRESA:
      return {
        title: 'Foco empresarial',
        subtitle: 'Resalta postulaciones recibidas y estado de vacantes/practicas.',
        keywords: ['postul', 'oferta', 'practic', 'empresa', 'pendient', 'acept'],
      };
    default:
      return {
        title: 'Resumen comparativo',
        subtitle: 'Vista relativa de indicadores del rol actual.',
        keywords: ['kpi'],
      };
  }
}

function getKpiRoleScore(
  roleInsight: ReturnType<typeof getRoleInsight>,
  item: { key: string; name: string },
) {
  const target = `${item.key} ${item.name}`.toLowerCase();
  const matchIndex = roleInsight.keywords.findIndex((keyword) => target.includes(keyword));
  if (matchIndex === -1) return 0;
  return roleInsight.keywords.length - matchIndex;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[170px] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label ? <p className="mb-2 font-semibold text-slate-800">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDisplayName(user: Usuario | null) {
  if (!user) return 'Usuario';
  if (user.perfil?.nombres || user.perfil?.apellidos) {
    return `${user.perfil?.nombres ?? ''} ${user.perfil?.apellidos ?? ''}`.trim();
  }
  if (user.perfil?.razonSocial) return user.perfil.razonSocial;
  return user.email;
}

function StatCard({
  title,
  value,
  icon,
  hint,
  color,
  trend = 'neutral',
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  hint?: string;
  color: 'blue' | 'green' | 'red' | 'amber';
  trend?: 'up' | 'down' | 'neutral';
}) {
  const palette = {
    blue: {
      card: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 text-blue-900',
      chip: 'bg-blue-600/10 text-blue-700 ring-1 ring-blue-200/80',
      icon: 'bg-blue-600 text-white shadow-blue-200',
    },
    green: {
      card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-emerald-900',
      chip: 'bg-emerald-600/10 text-emerald-700 ring-1 ring-emerald-200/80',
      icon: 'bg-emerald-600 text-white shadow-emerald-200',
    },
    red: {
      card: 'border-rose-100 bg-gradient-to-br from-rose-50 via-white to-red-50 text-rose-900',
      chip: 'bg-rose-600/10 text-rose-700 ring-1 ring-rose-200/80',
      icon: 'bg-rose-600 text-white shadow-rose-200',
    },
    amber: {
      card: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-amber-900',
      chip: 'bg-amber-600/10 text-amber-700 ring-1 ring-amber-200/80',
      icon: 'bg-amber-600 text-white shadow-amber-200',
    },
  };

  const trendText = trend === 'up' ? 'Al alza' : trend === 'down' ? 'En descenso' : 'Estable';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•';
  const style = palette[color];

  return (
    <article className={`group rounded-2xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.card}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">{title}</p>
          <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.chip}`}>
            <span>{trendIcon}</span>
            <span>{trendText}</span>
          </span>
        </div>
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${style.icon}`}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold leading-none tracking-tight">{value}</p>
      {hint ? <p className="mt-2 text-xs font-medium opacity-80">{hint}</p> : null}
    </article>
  );
}

function BasicRoleDashboard({ resumen }: { resumen?: DashboardResumen }) {
  const kpis = resumen?.kpis ?? [];
  const highlights = resumen?.highlights ?? [];
  const trend = resumen?.trend;

  const roleQuickAccess: Record<Rol, Array<{ label: string; href: string }>> = {
    [Rol.ADMIN]: [
      { label: 'Estudiantes', href: '/estudiantes' },
      { label: 'Practicas', href: '/practicas' },
      { label: 'Tesis', href: '/tesis' },
      { label: 'Reportes', href: '/reportes' },
    ],
    [Rol.COORDINADOR]: [
      { label: 'Estudiantes', href: '/estudiantes' },
      { label: 'Asesores', href: '/asesores' },
      { label: 'Practicas', href: '/practicas' },
      { label: 'Reportes', href: '/reportes' },
    ],
    [Rol.ASESOR]: [
      { label: 'Mis estudiantes', href: '/estudiantes' },
      { label: 'Practicas', href: '/practicas' },
      { label: 'Tesis', href: '/tesis' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
    [Rol.ESTUDIANTE]: [
      { label: 'Mis practicas', href: '/practicas' },
      { label: 'Mis tesis', href: '/tesis' },
      { label: 'Ofertas', href: '/practicas' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
    [Rol.EMPRESA]: [
      { label: 'Mi empresa', href: '/empresas' },
      { label: 'Ofertas', href: '/practicas' },
      { label: 'Postulaciones', href: '/practicas' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  };

  const quickLinks = roleQuickAccess[resumen?.role ?? Rol.ESTUDIANTE] ?? [];

  const chartData = kpis.slice(0, 6).map((item) => ({
    key: item.key,
    name: item.label,
    shortName: formatShortLabel(item.label, 14),
    value: item.value,
    hint: item.hint,
  }));

  const roleInsight = getRoleInsight(resumen?.role);

  const rankedKpis = [...chartData]
    .sort((a, b) => {
      const scoreA = getKpiRoleScore(roleInsight, a);
      const scoreB = getKpiRoleScore(roleInsight, b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.value - a.value;
    })
    .slice(0, 6);

  const maxKpiValue = rankedKpis.length ? Math.max(...rankedKpis.map((item) => item.value)) : 0;

  const kpiCardPalette = [
    'border-blue-100 bg-gradient-to-br from-blue-50 to-white text-blue-900',
    'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-emerald-900',
    'border-amber-100 bg-gradient-to-br from-amber-50 to-white text-amber-900',
    'border-rose-100 bg-gradient-to-br from-rose-50 to-white text-rose-900',
  ];

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((item: KpiItem, index) => (
          <article
            key={item.key}
            className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${kpiCardPalette[index % kpiCardPalette.length]}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">{item.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{item.value}</p>
            {item.hint ? <p className="mt-2 text-xs font-medium opacity-80">{item.hint}</p> : null}
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <article className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Comportamiento de indicadores</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{kpis.length} KPIs</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="value" name="Valor" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={36}>
                  <LabelList dataKey="value" position="top" fill="#1e3a8a" fontSize={11} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {chartData.map((item) => (
              <div key={item.key} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="mt-1 text-sm font-bold text-blue-700">{item.value}</p>
                {item.hint ? <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{item.hint}</p> : null}
              </div>
            ))}
          </div>
        </article>

        <div className="space-y-4">
          <article className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Tendencia del periodo</h3>
            {trend ? (
              <>
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">{trend.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-3xl font-bold tracking-tight text-slate-900">{trend.current}</p>
                      <p className="text-xs text-slate-500">Anterior: {trend.previous}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trend.delta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                    >
                      {trend.delta >= 0 ? '↑' : '↓'} {Math.abs(trend.percent)}%
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Highlights</p>
                  <div className="max-h-40 space-y-2 overflow-auto pr-1">
                    {highlights.length ? (
                      highlights.map((item, idx) => (
                        <div key={`${item}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {item}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Sin highlights para este periodo.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No hay datos de tendencia para este rol.</p>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{roleInsight.title}</h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">KPIs del rol</span>
            </div>
            <p className="mb-3 text-xs text-slate-500">{roleInsight.subtitle}</p>

            {rankedKpis.length ? (
              <div className="space-y-3">
                {rankedKpis.map((item) => {
                  const score = getKpiRoleScore(roleInsight, item);
                  const progress = maxKpiValue > 0 ? Math.round((item.value / maxKpiValue) * 100) : 0;
                  return (
                    <div key={`summary-${item.key}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                        <p className="text-sm font-bold text-blue-700">{item.value}</p>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {progress}% del valor mas alto del periodo · {score > 0 ? 'Relevancia alta para tu rol' : 'Relevancia general'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No hay indicadores disponibles para mostrar.</p>
            )}
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Accesos rapidos</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="group rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-3 py-3 text-center text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span className="inline-flex items-center justify-center gap-1">
                <span>{item.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>(`${new Date().getFullYear()}`);
  const [especialidad, setEspecialidad] = useState('');
  const [estado, setEstado] = useState('');

  const isAdmin = user?.rol === Rol.ADMIN;

  const { data: resumen, isLoading: loadingResumen } = useQuery<DashboardResumen>({
    queryKey: ['dashboard-stats', user?.rol],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: DashboardResumen }>(
        ENDPOINTS.DASHBOARD.MI_RESUMEN,
      );
      return data.data;
    },
  });

  const { data: adminAnalytics, isLoading: loadingAdmin } = useQuery<DashboardAdminAnalytics>({
    queryKey: ['admin-analytics', month, year, especialidad, estado],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: DashboardAdminAnalytics }>(
        ENDPOINTS.DASHBOARD.ADMIN_ANALYTICS,
        {
          params: {
            month: month || undefined,
            year: year || undefined,
            especialidad: especialidad || undefined,
            estado: estado || undefined,
          },
        },
      );
      return data.data;
    },
    enabled: isAdmin,
  });

  const lineTrend = useMemo(() => adminAnalytics?.charts.monthlyTrend ?? [], [adminAnalytics]);
  const careerDistribution = useMemo(() => adminAnalytics?.charts.careerDistribution ?? [], [adminAnalytics]);
  const companyDistribution = useMemo(() => adminAnalytics?.charts.companyDistribution ?? [], [adminAnalytics]);
  const donutStatus = useMemo(() => adminAnalytics?.charts.donutStatus ?? [], [adminAnalytics]);

  const pieColors = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

  return (
    <>
      <Header title="Dashboard" />

      <div className="h-[calc(100vh-73px)] overflow-hidden bg-slate-50 p-3 sm:p-4">
        <div className="flex h-full flex-col gap-4">
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-100 px-4 py-3 shadow-sm sm:px-5 sm:py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Vista general administrativa</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">Bienvenido, {getDisplayName(user)}</h2>
            </div>
            <p className="text-xs text-slate-500 sm:text-sm">
              {isAdmin ? 'Panel administrativo con control integral academico' : resumen?.title || 'Resumen general del sistema'}
            </p>
          </div>
        </section>

        {isAdmin ? (
          <>
            <section className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900">Filtros globales</h3>
                <button
                  type="button"
                  onClick={() => {
                    setMonth('');
                    setYear(`${new Date().getFullYear()}`);
                    setEspecialidad('');
                    setEstado('');
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="input-field"
                >
                  <option value="">Todos los meses</option>
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>{`Mes ${idx + 1}`}</option>
                  ))}
                </select>

                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="input-field"
                  placeholder="Año"
                />

                <input
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="input-field"
                  placeholder="Especialidad"
                />

                <input
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="input-field"
                  placeholder="Estado"
                />
              </div>
            </section>

            <div className="min-h-0 flex-1 overflow-auto pr-1">
            {loadingAdmin ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
                ))}
              </div>
            ) : (
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Estudiantes"
                  value={adminAnalytics?.kpis.estudiantesTotal ?? 0}
                  icon={<Users className="h-5 w-5" />}
                  color="blue"
                  trend="up"
                />
                <StatCard
                  title="Asesores"
                  value={adminAnalytics?.kpis.asesoresTotal ?? 0}
                  icon={<GraduationCap className="h-5 w-5" />}
                  color="green"
                  trend="up"
                />
                <StatCard
                  title="Empresas"
                  value={adminAnalytics?.kpis.empresasTotal ?? 0}
                  icon={<Building2 className="h-5 w-5" />}
                  color="amber"
                  trend="neutral"
                />
                <StatCard
                  title="Ofertas activas"
                  value={adminAnalytics?.kpis.ofertasActivas ?? 0}
                  icon={<Briefcase className="h-5 w-5" />}
                  color="red"
                  trend="up"
                />
                <StatCard
                  title="Practicas activas"
                  value={adminAnalytics?.kpis.practicasActivas ?? 0}
                  icon={<Layers className="h-5 w-5" />}
                  hint={`Completadas: ${adminAnalytics?.kpis.practicasCompletadas ?? 0}`}
                  color="green"
                  trend="up"
                />
                <StatCard
                  title="Tesis en proceso"
                  value={adminAnalytics?.kpis.tesisEnProceso ?? 0}
                  icon={<Layers className="h-5 w-5" />}
                  hint={`Finalizadas: ${adminAnalytics?.kpis.tesisFinalizadas ?? 0}`}
                  color="blue"
                  trend="neutral"
                />
                <StatCard
                  title="Postulaciones pendientes"
                  value={adminAnalytics?.kpis.postulacionesPendientes ?? 0}
                  icon={<ArrowUpRight className="h-5 w-5" />}
                  hint={`Aceptadas: ${adminAnalytics?.kpis.postulacionesAceptadas ?? 0} | Rechazadas: ${adminAnalytics?.kpis.postulacionesRechazadas ?? 0}`}
                  color="amber"
                  trend="down"
                />
                <StatCard
                  title="Rendimiento tesis"
                  value={`${adminAnalytics?.kpis.rendimientoTesis ?? 0}%`}
                  icon={<ArrowDownRight className="h-5 w-5" />}
                  color="red"
                  trend="up"
                />
              </section>
            )}

            <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Evolucion mensual</h3>
                <p className="mb-3 text-xs text-slate-500">Comparativo de registros de practicas y tesis por mes.</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lineTrend} margin={{ top: 8, right: 10, left: -12, bottom: 4 }} barCategoryGap={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '12px' }} />
                      <Bar
                        dataKey="practicas"
                        name="Practicas"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                      >
                        <LabelList dataKey="practicas" position="top" fill="#1e3a8a" fontSize={11} />
                      </Bar>
                      <Bar
                        dataKey="tesis"
                        name="Tesis"
                        fill="#f59e0b"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                      >
                        <LabelList dataKey="tesis" position="top" fill="#92400e" fontSize={11} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Distribucion por estado</h3>
                <p className="mb-3 text-xs text-slate-500">Vista proporcional de estados operativos y academicos.</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutStatus}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={95}
                        paddingAngle={2}
                        labelLine={false}
                        label={renderPiePercentLabel}
                      >
                        {donutStatus.map((entry, idx) => (
                          <Cell key={`${entry.name}-${idx}`} fill={pieColors[idx % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend verticalAlign="bottom" height={34} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Distribucion por carrera</h3>
                <p className="mb-3 text-xs text-slate-500">Concentracion de estudiantes por especialidad.</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={careerDistribution} margin={{ top: 8, right: 10, left: -12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" hide />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="value" name="Estudiantes" fill="#0ea5e9" radius={[8, 8, 0, 0]} maxBarSize={34} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Distribucion por empresa</h3>
                <p className="mb-3 text-xs text-slate-500">Participacion de empresas en practicas registradas.</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={companyDistribution} margin={{ top: 8, right: 10, left: -12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" hide />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="value" name="Practicas" fill="#22c55e" radius={[8, 8, 0, 0]} maxBarSize={34} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-slate-800">Alertas de practicas por vencer</h3>
                </div>
                {adminAnalytics?.alerts.length ? (
                  <div className="max-h-72 space-y-2 overflow-auto pr-1">
                    {adminAnalytics.alerts.map((item) => (
                      <div key={item.id} className="rounded-xl border border-amber-200/70 bg-amber-50/70 p-3 text-sm">
                        <p className="font-semibold leading-tight text-amber-900">{item.titulo}</p>
                        <p className="mt-1 text-amber-700">{item.estudiante} · {item.empresa}</p>
                        <p className="text-xs text-amber-600">Vence: {item.fechaFin ? formatDate(item.fechaFin as string) : 'Sin fecha'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Sin alertas en el periodo seleccionado.</p>
                )}
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Historial de acciones</h3>
                <div className="max-h-72 space-y-2 overflow-auto pr-1">
                  {(adminAnalytics?.actionLog ?? []).map((log) => (
                    <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                      <p className="font-semibold text-slate-800">{log.modulo} · {log.accion}</p>
                      <p className="text-slate-600">{log.descripcion}</p>
                      <p className="text-xs text-slate-400">{formatDate(log.fecha as string)}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Accesos rapidos</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(adminAnalytics?.quickAccess ?? []).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-3 py-3 text-center text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      <span>{item.label}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
            </div>
          </>
        ) : loadingResumen ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
              ))}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <BasicRoleDashboard resumen={resumen} />
          </div>
        )}
        </div>
      </div>
    </>
  );
}
