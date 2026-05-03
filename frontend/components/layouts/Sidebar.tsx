'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Rol } from '@/lib/types';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  FileText,
  BookOpen,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [Rol.ADMIN, Rol.COORDINADOR, Rol.ASESOR, Rol.ESTUDIANTE, Rol.EMPRESA],
  },
  {
    href: '/estudiantes',
    label: 'Estudiantes',
    icon: Users,
    roles: [Rol.ADMIN, Rol.COORDINADOR, Rol.ASESOR],
  },
  {
    href: '/asesores',
    label: 'Asesores',
    icon: GraduationCap,
    roles: [Rol.ADMIN, Rol.COORDINADOR],
  },
  {
    href: '/empresas',
    label: 'Empresas',
    icon: Building2,
    roles: [Rol.ADMIN, Rol.COORDINADOR],
  },
  {
    href: '/practicas',
    label: 'Prácticas',
    icon: Briefcase,
    roles: [Rol.ADMIN, Rol.COORDINADOR, Rol.ASESOR, Rol.ESTUDIANTE, Rol.EMPRESA],
  },
  {
    href: '/tesis',
    label: 'Tesis',
    icon: GraduationCap,
    roles: [Rol.ADMIN, Rol.COORDINADOR, Rol.ASESOR, Rol.ESTUDIANTE],
  },
  {
    href: '/reportes',
    label: 'Reportes',
    icon: FileText,
    roles: [Rol.ADMIN, Rol.COORDINADOR],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.rol)
  );

  const renderNav = () => (
    <nav className="flex-1 p-4 space-y-1">
      {visibleItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-700 text-white'
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {isActive && <ChevronRight className="h-3 w-3" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-yellow-400" />
          <span className="text-sm font-semibold">Sistema UNT</span>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} className="p-2 rounded hover:bg-blue-800">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menu lateral"
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'bg-blue-900 text-white flex flex-col min-h-screen w-64',
          'md:relative md:translate-x-0',
          'fixed top-0 left-0 z-40 transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-yellow-400" />
          <div>
            <p className="font-bold text-sm leading-tight">Sistema UNT</p>
            <p className="text-xs text-blue-300">Prácticas y Tesis</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      {renderNav()}

      {/* Footer */}
      <div className="p-4 border-t border-blue-800">
        <p className="text-xs text-blue-400 text-center">
          UNT © {new Date().getFullYear()}
        </p>
      </div>
      </aside>
    </>
  );
}
