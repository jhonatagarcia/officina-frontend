import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { serviceCatalogSchema, type ServiceCatalogSchema } from '@/features/services/schemas/service-catalog-schema';
import { servicesService } from '@/features/services/services/services-service';
import { normalizeNullableString } from '@/lib/utils';
import type { ApiErrorResponse } from '@/types/common';

export function useServiceForm(mode: 'create' | 'edit' | 'view', id: string, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['servico', id],
    queryFn: () => servicesService.getById(id),
    enabled: mode !== 'create',
  });

  const form = useForm<ServiceCatalogSchema>({
    resolver: zodResolver(serviceCatalogSchema),
    values:
      (query.data && {
        name: query.data.name,
        category: query.data.category,
        description: query.data.description ?? '',
        internalNotes: query.data.internalNotes ?? '',
        laborPrice: query.data.laborPrice,
        productPrice: 0,
        billingType: query.data.billingType,
        materialSource: query.data.materialSource,
        warrantyDays: query.data.warrantyDays ?? undefined,
        active: query.data.active,
      }) ?? {
        name: '',
        category: '',
        description: '',
        internalNotes: '',
        laborPrice: 0,
        productPrice: 0,
        billingType: 'PARTS_AND_LABOR',
        materialSource: 'SHOP_SUPPLIES',
        warrantyDays: undefined,
        active: true,
      },
  });

  useEffect(() => {
    form.setValue('productPrice', 0, { shouldValidate: true });
  }, [form]);

  const mutation = useMutation({
    mutationFn: async (values: ServiceCatalogSchema) => {
      const payload = {
        name: values.name.trim(),
        category: values.category.trim(),
        description: normalizeNullableString(values.description),
        internalNotes: normalizeNullableString(values.internalNotes),
        laborPrice: values.laborPrice,
        productPrice: 0,
        billingType: values.billingType,
        materialSource: values.materialSource,
        warrantyDays: values.warrantyDays ?? null,
      };

      if (mode === 'edit') {
        const updatedItem = await servicesService.update(id, payload);

        if (query.data && values.active !== query.data.active) {
          return values.active ? servicesService.activate(updatedItem.id) : servicesService.deactivate(updatedItem.id);
        }

        return updatedItem;
      }

      return servicesService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      queryClient.invalidateQueries({ queryKey: ['servico'] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'servicos'] });
      toast.success('Serviço salvo com sucesso.');
      onSuccess();
    },
    onError: (error: ApiErrorResponse) => {
      if (error.statusCode === 409) {
        form.setError('name', {
          type: 'server',
          message: error.message || 'Já existe um serviço com este nome na categoria informada.',
        });
        return;
      }

      toast.error(error.message || 'Não foi possível salvar o serviço.');
    },
  });

  return { query, form, mutation };
}
