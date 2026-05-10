import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { InventoryItemForm } from '@/features/inventory/components/inventory-item-form';
import { InventoryQuantityChangeDialog } from '@/features/inventory/components/inventory-quantity-change-dialog';
import { useInventoryForm } from '@/features/inventory/hooks/use-inventory-form';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import type { InventoryItemSchema } from '@/features/inventory/schemas/inventory-item-schema';

export function InventoryFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { query, form, mutation } = useInventoryForm(mode, id, () => navigate('/app/estoque'));
  const [pendingValues, setPendingValues] = useState<InventoryItemSchema | null>(null);
  const movementsQuery = useQuery({
    queryKey: ['estoque-item', id, 'movements'],
    queryFn: () => inventoryService.getMovements(id),
    enabled: mode === 'edit' && Boolean(pendingValues),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  function handleSubmit(values: InventoryItemSchema) {
    if (mode === 'edit' && query.data && values.quantity !== query.data.quantity) {
      setPendingValues(values);
      return;
    }

    mutation.mutate(values);
  }

  function handleConfirmQuantityChange() {
    if (!pendingValues) return;

    mutation.mutate(pendingValues);
    setPendingValues(null);
  }

  return (
    <PageContainer>
      <PageHeader
        title={mode === 'create' ? 'Nova peça' : 'Editar peça / Produto'}
        description={
          mode === 'create'
            ? 'Cadastre itens de estoque para alimentar a base da oficina.'
            : 'Atualize os dados do item de estoque.'
        }
      />
      <Card>
        <CardContent className="p-6">
          <InventoryItemForm
            form={form}
            mode={mode}
            internalCode={query.data?.internalCode ?? ''}
            isPending={mutation.isPending}
            onCancel={() => navigate('/app/estoque')}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
      {pendingValues && query.data ? (
        <InventoryQuantityChangeDialog
          currentQuantity={query.data.quantity}
          isPending={mutation.isPending}
          movementsQuery={movementsQuery}
          pendingValues={pendingValues}
          onCancel={() => setPendingValues(null)}
          onConfirm={handleConfirmQuantityChange}
        />
      ) : null}
    </PageContainer>
  );
}
