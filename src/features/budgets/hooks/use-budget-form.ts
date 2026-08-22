import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { budgetSchema, type BudgetSchema } from '@/features/budgets/schemas/budget-schema';
import { budgetsService } from '@/features/budgets/services/budgets-service';
import type { Budget } from '@/features/budgets/types';
import { normalizeNullableString } from '@/lib/utils';

const defaultBudgetValues: BudgetSchema = {
  clientId: '',
  vehicleId: '',
  problemDescription: '',
  notes: '',
  discount: 0,
  items: [
    {
      type: 'LABOR',
      serviceCatalogItemId: '',
      inventoryItemId: '',
      serviceCode: '',
      description: '',
      quantity: 1,
      unitPrice: 1,
    },
  ],
};

function toBudgetFormValues(budget: Budget): BudgetSchema {
  return {
    clientId: budget.clientId,
    vehicleId: budget.vehicleId,
    problemDescription: budget.problemDescription,
    notes: budget.notes ?? '',
    discount: budget.discount,
    items: budget.items.map((item) => ({
      id: item.id,
      type: item.type,
      serviceCatalogItemId: item.serviceCatalogItemId ?? '',
      inventoryItemId: item.inventoryItemId ?? '',
      serviceCode: item.serviceCode ?? '',
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
}

export function useBudgetForm(mode: 'create' | 'edit' | 'view', id: string, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const budgetQuery = useQuery({
    queryKey: ['orcamento', id],
    queryFn: () => budgetsService.getById(id),
    enabled: mode !== 'create',
  });

  const form = useForm<BudgetSchema>({
    resolver: zodResolver(budgetSchema),
    defaultValues: defaultBudgetValues,
  });

  useEffect(() => {
    if (mode === 'create') {
      form.reset(defaultBudgetValues);
      return;
    }

    if (budgetQuery.data) {
      form.reset(toBudgetFormValues(budgetQuery.data));
    }
  }, [budgetQuery.data, form, mode]);

  const fieldArray = useFieldArray({ control: form.control, name: 'items' });

  const mutation = useMutation({
    mutationFn: async (values: BudgetSchema) => {
      const payload = {
        clientId: values.clientId,
        vehicleId: values.vehicleId,
        problemDescription: values.problemDescription,
        notes: normalizeNullableString(values.notes) ?? undefined,
        discount: values.discount,
        items: values.items.map((item) => ({
          type: item.type,
          serviceCatalogItemId: item.serviceCatalogItemId || undefined,
          inventoryItemId: item.inventoryItemId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      if (mode === 'edit') return budgetsService.update(id, payload);
      return budgetsService.create(payload);
    },
    onSuccess: (savedBudget) => {
      queryClient.setQueryData(['orcamento', savedBudget.id], savedBudget);
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(
        mode === 'edit' && budgetQuery.data?.status === 'APROVADO'
          ? 'Orçamento atualizado e enviado para nova aprovação.'
          : mode === 'edit'
            ? 'Orçamento atualizado com sucesso.'
            : 'Orçamento criado com sucesso.',
      );
      onSuccess();
    },
  });

  const items = form.watch('items');
  const discount = form.watch('discount') || 0;
  const total = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0) - discount;

  return {
    budgetQuery,
    form,
    fieldArray,
    mutation,
    items,
    discount,
    total,
  };
}
