import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { inventoryItemSchema, type InventoryItemSchema } from '@/features/inventory/schemas/inventory-item-schema';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import { normalizeNullableString } from '@/lib/utils';
import type { ApiErrorResponse } from '@/types/common';

export function useInventoryForm(onSuccess: () => void) {
  const form = useForm<InventoryItemSchema>({
    resolver: zodResolver(inventoryItemSchema),
    values: {
      name: '',
      internalCode: '',
      category: '',
      supplier: '',
      quantity: 0,
      minimumQuantity: 0,
      cost: 0,
      salePrice: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: InventoryItemSchema) =>
      inventoryService.create({
        name: values.name.trim(),
        internalCode: values.internalCode.trim(),
        category: normalizeNullableString(values.category),
        supplier: normalizeNullableString(values.supplier),
        quantity: values.quantity,
        minimumQuantity: values.minimumQuantity,
        cost: values.cost,
        salePrice: values.salePrice,
      }),
    onSuccess: () => {
      toast.success('Peça cadastrada com sucesso.');
      onSuccess();
    },
    onError: (error: ApiErrorResponse) => {
      if (error.statusCode === 409) {
        form.setError('internalCode', {
          type: 'server',
          message: error.message || 'Já existe uma peça cadastrada com este código interno.',
        });
        return;
      }

      toast.error(error.message || 'Não foi possível salvar a peça.');
    },
  });

  return { form, mutation };
}
