'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Oferta, PaginatedResponse } from '@/lib/types';
import toast from 'react-hot-toast';

export function useOfertas(params?: {
  empresaId?: number;
  activo?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['ofertas', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Oferta> }>(
        ENDPOINTS.OFERTAS.BASE,
        { params }
      );
      return data.data;
    },
  });
}

export function useOferta(id: number) {
  return useQuery({
    queryKey: ['oferta', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Oferta }>(
        ENDPOINTS.OFERTAS.BY_ID(id)
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function usePostular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ofertaId: number) => {
      const { data } = await apiClient.post(ENDPOINTS.OFERTAS.POSTULAR(ofertaId));
      return data.data;
    },
    onSuccess: () => {
      toast.success('Postulación enviada correctamente');
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al postular');
    },
  });
}
