import type { AppliedServiceOrderPart } from '@/features/service-orders/lib/service-order-parts';
import type { ServiceOrder, ServiceOrderBudgetItem } from '@/features/service-orders/types';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateOnly, formatPhone } from '@/lib/utils';

interface ServiceOrderReportCardProps {
  order: ServiceOrder;
  laborItems: ServiceOrderBudgetItem[];
  appliedParts: AppliedServiceOrderPart[];
}

export function ServiceOrderReportCard({ order, laborItems, appliedParts }: ServiceOrderReportCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório da Execução</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>
          <span className="font-medium">Cliente:</span> {order.clientName}
        </p>
        <p>
          <span className="font-medium">Telefone:</span> {formatPhone(order.client?.phone)}
        </p>
        <p>
          <span className="font-medium">Veículo:</span> {order.vehicleLabel}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <StatusBadge status={order.status} />
        </div>
        <p>
          <span className="font-medium">Problema relatado:</span> {order.problemDescription}
        </p>
        <div className="space-y-2">
          <p className="font-medium">Serviços executados</p>
          {laborItems.length ? (
            laborItems.map((item) => (
              <p key={item.id}>
                {item.serviceCode ? `${item.serviceCode} • ` : ''}
                {item.description}
                {item.quantity > 1 ? ` x${item.quantity}` : ''}
              </p>
            ))
          ) : (
            <p>-</p>
          )}
        </div>
        <p>
          <span className="font-medium">Previsão de entrega:</span>{' '}
          {order.expectedDeliveryAt ? formatDateOnly(order.expectedDeliveryAt) : 'Não informada'}
        </p>
        <p>
          <span className="font-medium">Mecânico responsável:</span> {order.mechanicName ?? '-'}
        </p>
        <p>
          <span className="font-medium">Valor a ser pago pelo cliente:</span> {formatCurrency(order.total ?? 0)}
        </p>
        <p>
          <span className="font-medium">Observações:</span> {order.notes ?? '-'}
        </p>
        <div className="space-y-2 rounded-xl border p-4">
          <p className="font-medium">Peças aplicadas</p>
          {appliedParts.length ? (
            appliedParts.map((part) => (
              <div key={part.id} className="grid gap-1 rounded-lg border border-border/60 p-3 text-sm">
                <p className="font-medium">
                  {part.inventoryItem.internalCode} • {part.inventoryItem.name}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                  <span>Quantidade: {part.quantity}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma peça lançada nesta OS.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
