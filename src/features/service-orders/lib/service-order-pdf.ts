import type { AppliedServiceOrderPart } from '@/features/service-orders/lib/service-order-parts';
import type { ServiceOrder, ServiceOrderBudgetItem } from '@/features/service-orders/types';
import { formatServiceOrderStatusLabel } from '@/features/service-orders/lib/service-order-details';
import { formatCurrency, formatDateOnly, formatPhone, formatServiceOrderNumber } from '@/lib/utils';

interface GenerateServiceOrderPdfParams {
  order: ServiceOrder;
  laborItems: ServiceOrderBudgetItem[];
  appliedParts: AppliedServiceOrderPart[];
}

export async function generateServiceOrderPdf({ order, laborItems, appliedParts }: GenerateServiceOrderPdfParams) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed = 8) => {
    if (y + needed <= pageHeight - margin) return;
    pdf.addPage();
    y = margin;
  };

  const addLines = (lines: string[], size = 11, step = 6) => {
    pdf.setFontSize(size);
    lines.forEach((line) => {
      ensureSpace(step);
      pdf.text(line, margin, y);
      y += step;
    });
  };

  const addWrappedText = (text: string, size = 11, step = 6, indent = 0) => {
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, maxWidth - indent) as string[];
    lines.forEach((line) => {
      ensureSpace(step);
      pdf.text(line, margin + indent, y);
      y += step;
    });
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(title, margin, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('Relatório da execução', margin, y);
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Documento para entrega ao cliente', margin, y);
  y += 10;

  addLines([
    `Cliente: ${order.clientName}`,
    `Telefone: ${formatPhone(order.client?.phone)}`,
    `Veículo: ${order.vehicleLabel}`,
    `Status: ${formatServiceOrderStatusLabel(order.status)}`,
    `Previsão de entrega: ${order.expectedDeliveryAt ? formatDateOnly(order.expectedDeliveryAt) : 'Não informada'}`,
    `Mecânico responsável: ${order.mechanicName ?? '-'}`,
    `Valor a ser pago pelo cliente: ${formatCurrency(order.total ?? 0)}`,
  ]);

  addSectionTitle('Problema relatado');
  addWrappedText(order.problemDescription || '-');

  addSectionTitle('Observações');
  addWrappedText(order.notes || '-');

  addSectionTitle('Serviços executados');
  if (laborItems.length) {
    laborItems.forEach((item) => {
      addWrappedText(
        `- ${item.serviceCode ? `${item.serviceCode} • ` : ''}${item.description}${item.quantity > 1 ? ` x${item.quantity}` : ''}`,
      );
    });
  } else {
    addWrappedText('-');
  }

  addSectionTitle('Peças aplicadas');
  if (appliedParts.length) {
    appliedParts.forEach((part) => {
      addWrappedText(`- ${part.inventoryItem.internalCode} • ${part.inventoryItem.name}`);
      addWrappedText(`Quantidade: ${part.quantity}`, 10, 5, 4);
    });
  } else {
    addWrappedText('Nenhuma peça lançada nesta OS.');
  }

  pdf.save(`detalhes-da-execucao-${formatServiceOrderNumber(order.orderNumber)}.pdf`);
}
