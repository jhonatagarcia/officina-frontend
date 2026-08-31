import type { Budget, BudgetItem } from '@/features/budgets/types';
import {
  formatCpfCnpj,
  formatCurrency,
  formatDateOnly,
  formatPlate,
} from '@/lib/utils';

function getBudgetItemTypeLabel(type: BudgetItem['type']) {
  if (type === 'LABOR') return 'Serviço';
  if (type === 'PART') return 'Peça';
  return 'Serviço + peça';
}

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

interface GenerateBudgetPdfParams {
  budget: Budget;
}

export async function generateBudgetPdf({ budget }: GenerateBudgetPdfParams) {
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

  const addWrappedText = (text: string, size = 10, step = 5, indent = 0) => {
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text || '-', maxWidth - indent) as string[];
    lines.forEach((line) => {
      ensureSpace(step);
      pdf.text(line, margin + indent, y);
      y += step;
    });
  };

  const addInfoLine = (label: string, value: string) => {
    ensureSpace(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`${label}:`, margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value || '-', margin + 43, y);
    y += 6;
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(11);
    y += 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(title, margin, y);
    y += 3;
    pdf.setDrawColor(230, 230, 230);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
    pdf.setFont('helvetica', 'normal');
  };

  pdf.setFillColor(3, 6, 22);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  pdf.setTextColor(255, 122, 61);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('AutoPro System', margin, 15);
  pdf.setTextColor(241, 245, 249);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text('Orçamento de serviços automotivos', margin, 22);
  pdf.text('Documento para análise e aprovação do cliente', margin, 28);
  pdf.setTextColor(20, 20, 20);
  y = 50;

  addSectionTitle('Identificação do orçamento');
  addInfoLine('Código', budget.code);
  addInfoLine('Data de emissão', formatDateOnly(budget.createdAt));

  addSectionTitle('Cliente e veículo');
  addInfoLine('Cliente', budget.client?.name ?? '-');
  addInfoLine('CPF/CNPJ', formatCpfCnpj(budget.client?.document));
  addInfoLine(
    'Veículo',
    budget.vehicle
      ? `${formatPlate(budget.vehicle.plate)} - ${budget.vehicle.brand} ${budget.vehicle.model} ${budget.vehicle.year}`
      : '-',
  );

  addSectionTitle('Problema relatado');
  addWrappedText(budget.problemDescription);

  addSectionTitle('Itens do orçamento');
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, y - 4, maxWidth, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Tipo', margin + 1, y);
  pdf.text('Descrição', margin + 30, y);
  pdf.text('Qtd.', margin + 125, y);
  pdf.text('Unit.', margin + 142, y);
  pdf.text('Total', margin + 164, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');

  budget.items.forEach((item, index) => {
    const description = `${item.serviceCode ? `${item.serviceCode} - ` : ''}${item.description}`;
    const descriptionLines = pdf.splitTextToSize(description, 88) as string[];
    const rowHeight = Math.max(9, descriptionLines.length * 4.5 + 3);
    ensureSpace(rowHeight);

    if (index % 2 === 0) {
      pdf.setFillColor(252, 252, 252);
      pdf.rect(margin, y - 4, maxWidth, rowHeight, 'F');
    }

    pdf.setFontSize(8.5);
    pdf.text(getBudgetItemTypeLabel(item.type), margin + 1, y);
    descriptionLines.forEach((line, lineIndex) => {
      pdf.text(line, margin + 30, y + lineIndex * 4.5);
    });
    pdf.text(String(item.quantity), margin + 126, y);
    pdf.text(formatCurrency(item.unitPrice), margin + 142, y);
    pdf.text(formatCurrency(item.totalPrice), margin + 164, y);
    y += rowHeight;
  });

  addSectionTitle('Observações');
  addWrappedText(budget.notes || 'Sem observações adicionais.');

  addSectionTitle('Resumo financeiro');
  addInfoLine('Subtotal', formatCurrency(budget.subtotal));
  addInfoLine('Desconto', formatCurrency(budget.discount));
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  ensureSpace(8);
  pdf.text('Valor total do orçamento:', margin, y);
  pdf.text(formatCurrency(budget.total), pageWidth - margin, y, { align: 'right' });
  y += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  addWrappedText(
    'Este documento descreve os serviços e peças previstos para execução. A aprovação confirma ciência do escopo e dos valores apresentados.',
    9,
    4.5,
  );

  pdf.save(`orcamento-${sanitizeFileName(budget.code)}.pdf`);
}
