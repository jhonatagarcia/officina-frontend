import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { inventoryItemSchema, type InventoryItemSchema } from '@/features/inventory/schemas/inventory-item-schema';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import { normalizeNullableString } from '@/lib/utils';
import type { ApiErrorResponse } from '@/types/common';

export function useInventoryForm(mode: 'create' | 'edit', id: string, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['estoque-item', id],
    queryFn: () => inventoryService.getById(id),
    enabled: mode === 'edit',
  });

  const form = useForm<InventoryItemSchema>({
    resolver: zodResolver(inventoryItemSchema),
    values:
      (query.data && {
        name: query.data.name,
        category: query.data.category ?? '',
        supplier: query.data.supplier ?? '',
        quantity: query.data.quantity,
        minimumQuantity: query.data.minimumQuantity,
        cost: query.data.cost,
        salePrice: query.data.salePrice,
      }) ?? {
        name: '',
        category: '',
        supplier: '',
        quantity: 0,
        minimumQuantity: 0,
        cost: 0,
        salePrice: 0,
      },
  });

  const mutation = useMutation({
    mutationFn: async (values: InventoryItemSchema) => {
      const payload = {
        name: values.name.trim(),
        category: normalizeNullableString(values.category),
        supplier: normalizeNullableString(values.supplier),
        quantity: values.quantity,
        minimumQuantity: values.minimumQuantity,
        cost: values.cost,
        salePrice: values.salePrice,
      };

      if (mode === 'edit') return inventoryService.update(id, payload);
      return inventoryService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      queryClient.invalidateQueries({ queryKey: ['estoque-item'] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'estoque'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      toast.success('Peça salva com sucesso.');
      onSuccess();
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.message || 'Não foi possível salvar a peça.');
    },
  });

  return { query, form, mutation };
}
