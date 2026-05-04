'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layouts/Sidebar';
import { useAuth } from '@/lib/hooks/useAuth';
import { Rol } from '@/lib/types';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
    if (!loading && user && user.rol !== Rol.ADMIN && user.rol !== Rol.COORDINADOR && user.rol !== Rol.ASESOR) {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, user, router]);
  if (loading) return null;
  if (!isAuthenticated) return null;
  return (<div className="h-screen md:flex"><Sidebar /><main className="flex-1 overflow-hidden">{children}</main></div>);
}
