'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layouts/Header';
import PracticaCreateForm from '@/components/forms/PracticaCreateForm';

export default function NuevaPracticaPage() {
  const router = useRouter();

  return (
    <>
      <Header title="Nueva Práctica" />
      <div className="p-6 max-w-2xl">
        <Link href="/practicas" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-6">Registrar Práctica Preprofesional</h2>

          <PracticaCreateForm
            onSuccess={() => router.push('/practicas')}
            onCancel={() => router.push('/practicas')}
          />
        </div>
      </div>
    </>
  );
}
