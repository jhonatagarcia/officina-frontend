import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { FormCard } from '@/components/shared/form-layout';
import { Button } from '@/components/ui/button';
import { InventoryItemForm } from '@/features/inventory/components/inventory-item-form';
import { InventoryQuantityChangeDialog } from '@/features/inventory/components/inventory-quantity-change-dialog';
import { InventoryRelatedOrdersDialog } from '@/features/inventory/components/inventory-related-orders-dialog';
import { useInventoryForm } from '@/features/inventory/hooks/use-inventory-form';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import type { InventoryItemSchema } from '@/features/inventory/schemas/inventory-item-schema';
import type { RelatedPendingServiceOrders } from '@/features/inventory/types';

export function InventoryFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [relatedPendingOrders, setRelatedPendingOrders] = useState<RelatedPendingServiceOrders | null>(null);
  const { query, form, mutation } = useInventoryForm(mode, id, (result) => {
    if (result.relatedPendingServiceOrders?.count) {
      setRelatedPendingOrders(result.relatedPendingServiceOrders);
      return;
    }

    navigate('/app/estoque');
  });
  const [pendingValues, setPendingValues] =
    useState<InventoryItemSchema | null>(null);
  const movementsQuery = useQuery({
    queryKey: ['estoque-item', id, 'movements'],
    queryFn: () => inventoryService.getMovements(id),
    enabled: mode === 'edit' && Boolean(pendingValues),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  function handleSubmit(values: InventoryItemSchema) {
    if (
      mode === 'edit' &&
      query.data &&
      values.quantity !== query.data.quantity
    ) {
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
      >
        <Button
          className="min-h-11 rounded-xl bg-white/90 font-semibold"
          variant="outline"
          onClick={() => navigate('/app/estoque')}
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Voltar
        </Button>
      </PageHeader>
      <FormCard>
        <InventoryItemForm
          form={form}
          mode={mode}
          internalCode={query.data?.internalCode ?? ''}
          isPending={mutation.isPending}
          onSubmit={handleSubmit}
        />
      </FormCard>
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
      <InventoryRelatedOrdersDialog
        open={Boolean(relatedPendingOrders)}
        related={relatedPendingOrders}
        onOpenChange={(open) => {
          if (!open) setRelatedPendingOrders(null);
        }}
        onCloseWithoutAction={() => {
          setRelatedPendingOrders(null);
          navigate('/app/estoque');
        }}
      />
    </PageContainer>
  );
}
