import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  createMechanicSchema,
  type MechanicSchema,
} from '@/features/mechanics/schemas/mechanic-schema';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import type { ApiErrorResponse } from '@/types/common';

export function useMechanicForm(
  mode: 'create' | 'edit' | 'view',
  id: string,
  onSuccess: () => void,
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['mecanico', id],
    queryFn: () => mechanicsService.getById(id),
    enabled: mode !== 'create',
  });

  const form = useForm<MechanicSchema>({
    resolver: zodResolver(createMechanicSchema(mode)),
    values: (query.data && {
      name: query.data.name,
      isActive: query.data.isActive,
      userId: query.data.user?.id ?? null,
    }) ?? {
      name: '',
      isActive: true,
      userId: null,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: MechanicSchema) => {
      const payload = {
        name: values.name.trim(),
        function: 'MECHANIC' as const,
        isActive: values.isActive,
        ...(mode === 'edit' || values.userId ? { userId: values.userId } : {}),
      };

      if (mode === 'edit') return mechanicsService.update(id, payload);
      return mechanicsService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mecanicos'] });
      queryClient.invalidateQueries({ queryKey: ['mecanico'] });
      toast.success('Mecânico salvo com sucesso.');
      onSuccess();
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.message || 'Não foi possível salvar o mecânico.');
    },
  });

  return { query, form, mutation };
}
