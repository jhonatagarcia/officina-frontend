import type { ServiceOrder, ServiceOrderBudgetItem, ServiceOrderStatus } from '@/features/service-orders/types';

export function toDateInputValue(value?: string | null) {
  if (!value) return '';

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  return '';
}

export function getTodayDateInputMin() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function validateExpectedDeliveryAtValue(value: string) {
  if (!value) return null;

  const match = value.match(/^(\d{4})-\d{2}-\d{2}$/);
  if (!match) {
    return 'Informe uma data valida.';
  }

  if ((match[1] ?? '').length !== 4) {
    return 'O ano da previsao deve ter 4 digitos.';
  }

  const parsedValue = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedValue.getTime())) {
    return 'Informe uma data valida.';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsedValue < today) {
    return 'A previsao de entrega nao pode ser anterior ao dia atual.';
  }

  return null;
}

export function formatServiceOrderStatusLabel(status: ServiceOrderStatus) {
  switch (status) {
    case 'ABERTA':
      return 'Aberta';
    case 'AGUARDANDO_PECA':
      return 'Aguardando peça';
    case 'EM_ANDAMENTO':
      return 'Em andamento';
    case 'FINALIZADA':
      return 'Finalizada';
    case 'ENTREGUE':
      return 'Entregue';
    default:
      return status;
  }
}

export function getServiceOrderLaborItems(order: ServiceOrder): ServiceOrderBudgetItem[] {
  const laborItems = getEditableServiceOrderItems(order).filter(
    (item) => item.type === 'LABOR' || item.type === 'LABOR_AND_PART',
  );

  if (laborItems.length) return laborItems;
  if (order.executionItemsMaterialized) return [];

  const performedDescription = order.servicesPerformed?.trim();
  if (!performedDescription) return [];

  return [
    {
      id: 'services-performed',
      type: 'LABOR',
      inventoryItemId: null,
      serviceCode: null,
      description: performedDescription,
      quantity: 1,
      unitPrice: order.laborTotal ?? order.total ?? 0,
      totalPrice: order.laborTotal ?? order.total ?? 0,
      inventoryItem: null,
    },
  ];
}

export function getEditableServiceOrderItems(order: ServiceOrder): ServiceOrderBudgetItem[] {
  if (order.executionItemsMaterialized) {
    return order.executionItems ?? [];
  }

  return order.executionItems?.length ? order.executionItems : order.budgetItems ?? [];
}
