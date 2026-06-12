import { Edit3, PackageCheck, Plus, XCircle } from 'lucide-react';
import type { ServiceOrderPendingPart, ServiceOrderStatus } from '@/features/service-orders/types';
import {
  canResumeFromPendingPartStatus,
  getPendingPartStatusClassName,
  getPendingPartStatusLabel,
} from '@/features/service-orders/lib/pending-part-status';
import { canShowResumeServiceOrderAction } from '@/features/service-orders/lib/service-order-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatDateOnly } from '@/lib/utils';

interface PendingPartsCardProps {
  isLoading: boolean;
  isError: boolean;
  serviceOrderStatus: ServiceOrderStatus;
  pendingParts: ServiceOrderPendingPart[];
  readOnly?: boolean;
  onAdd: () => void;
  onEdit: (pendingPart: ServiceOrderPendingPart) => void;
  onCancel: (pendingPart: ServiceOrderPendingPart) => void;
  onResume: () => void;
  onRetry: () => void;
}

export function PendingPartsCard({
  isLoading,
  isError,
  serviceOrderStatus,
  pendingParts,
  readOnly = false,
  onAdd,
  onEdit,
  onCancel,
  onResume,
  onRetry,
}: PendingPartsCardProps) {
  const shouldShowResumeAction = canShowResumeServiceOrderAction(serviceOrderStatus, pendingParts);

  return (
    <Card className="bg-card shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Peças pendentes</p>
          <CardTitle className="mt-1 text-xl">Aguardando peça</CardTitle>
        </div>
        {!readOnly ? (
          <Button className="rounded-xl font-semibold" type="button" variant="outline" onClick={onAdd}>
            <Plus className="size-4" strokeWidth={1.75} />
            Adicionar peça
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando peças pendentes...</p> : null}
        {isError ? (
          <div className="rounded-xl border border-rose-200 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-500">Não foi possível carregar as peças pendentes.</p>
            <Button className="mt-3 rounded-xl" type="button" variant="outline" onClick={onRetry}>
              Tentar novamente
            </Button>
          </div>
        ) : null}
        {!isLoading && !isError && pendingParts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Nenhuma peça pendente cadastrada para esta OS.
          </div>
        ) : null}
        {pendingParts.map((part) => (
          <div key={part.id} className="rounded-xl border border-border-soft p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{part.inventoryItem.name}</p>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-bold text-foreground">
                    {part.inventoryItem.internalCode}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Necessário: <span className="font-semibold text-foreground">{part.quantityRequired}</span> · Disponível em estoque:{' '}
                  <span className="font-semibold text-foreground">{part.inventoryItem.quantity}</span>
                </p>
                {part.expectedArrivalAt ? (
                  <p className="mt-1 text-sm text-muted-foreground">Previsão: {formatDateOnly(part.expectedArrivalAt)}</p>
                ) : null}
                {part.note ? <p className="mt-2 text-sm italic text-muted-foreground">{part.note}</p> : null}
              </div>
              <span className={cn('inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-bold', getPendingPartStatusClassName(part.status))}>
                {getPendingPartStatusLabel(part.status)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!readOnly && serviceOrderStatus === 'AGUARDANDO_PECA' && canResumeFromPendingPartStatus(part.status) ? (
                <Button className="rounded-xl font-semibold" type="button" onClick={onResume}>
                  <PackageCheck className="size-4" strokeWidth={1.75} />
                  Retomar OS
                </Button>
              ) : null}
              {!readOnly ? (
                <Button className="rounded-xl font-semibold" type="button" variant="outline" onClick={() => onEdit(part)}>
                  <Edit3 className="size-4" strokeWidth={1.75} />
                  Editar
                </Button>
              ) : null}
              {!readOnly && part.status !== 'CANCELED' && part.status !== 'RESOLVED' ? (
                <Button className="rounded-xl font-semibold" type="button" variant="outline" onClick={() => onCancel(part)}>
                  <XCircle className="size-4" strokeWidth={1.75} />
                  Cancelar pendência
                </Button>
              ) : null}
            </div>
          </div>
        ))}
        {!readOnly && shouldShowResumeAction ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-500">
            Todas as peças necessárias já estão disponíveis. Confirme em Retomar OS para voltar o serviço para Em andamento.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
