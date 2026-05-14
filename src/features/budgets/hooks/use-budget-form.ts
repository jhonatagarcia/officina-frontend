import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { budgetSchema, type BudgetSchema } from '@/features/budgets/schemas/budget-schema';
import { budgetsService } from '@/features/budgets/services/budgets-service';
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

export function useBudgetForm(mode: 'create' | 'view', id: string, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const budgetQuery = useQuery({
    queryKey: ['orcamento', id],
    queryFn: () => budgetsService.getById(id),
    enabled: mode === 'view',
  });

  const form = useForm<BudgetSchema>({
    resolver: zodResolver(budgetSchema),
    values:
      (budgetQuery.data && {
        clientId: budgetQuery.data.clientId,
        vehicleId: budgetQuery.data.vehicleId,
        problemDescription: budgetQuery.data.problemDescription,
        notes: budgetQuery.data.notes ?? '',
        discount: budgetQuery.data.discount,
        items: budgetQuery.data.items.map((item) => ({
          type: item.type,
          serviceCatalogItemId: item.serviceCatalogItemId ?? '',
          inventoryItemId: item.inventoryItemId ?? '',
          serviceCode: item.serviceCode ?? '',
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }) ??
      defaultBudgetValues,
  });

  const fieldArray = useFieldArray({ control: form.control, name: 'items' });

  const mutation = useMutation({
    mutationFn: async (values: BudgetSchema) => {
      return budgetsService.create({
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
      });
    },
    onSuccess: (savedBudget) => {
      queryClient.setQueryData(['orcamento', savedBudget.id], savedBudget);
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Orçamento criado com sucesso.');
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
