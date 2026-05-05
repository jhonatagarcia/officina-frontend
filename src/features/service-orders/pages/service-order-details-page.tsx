import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import { serviceOrdersService } from '@/features/service-orders/services/service-orders-service';
import type { ServiceOrderStatus } from '@/features/service-orders/types';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDateOnly, formatPhone, formatServiceOrderNumber } from '@/lib/utils';

function toDateInputValue(value?: string | null) {
  if (!value) return '';

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  return '';
}

function getTodayDateInputMin() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function validateExpectedDeliveryAtValue(value: string) {
  if (!value) return null;

  const match = value.match(/^(\d{4})-\d{2}-\d{2}$/);
  if (!match) {
    return 'Informe uma data valida.';
  }

  if (match[1].length !== 4) {
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

function formatServiceOrderStatusLabel(status: ServiceOrderStatus) {
  switch (status) {
    case 'ABERTA':
      return 'Aberta';
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

function buildServiceOrderStatusMessage(status: ServiceOrderStatus, clientName: string) {
  const greeting = clientName ? `Olá, ${clientName}.` : 'Ola.';
  const messages: Partial<Record<ServiceOrderStatus, string>> = {
    EM_ANDAMENTO: `${greeting} o serviço do seu carro esta em andamento.`,
    FINALIZADA: `${greeting} o seu carro esta pronto.`,
    ENTREGUE: `${greeting} obrigado pela confiança de nossos serviços, volte sempre.`,
  };

  return messages[status] ?? `${greeting} O status da sua ordem de servico foi atualizado para ${formatServiceOrderStatusLabel(status)}.`;
}

function normalizeWhatsAppPhone(phone?: string | null) {
  const digits = phone?.replace(/\D/g, '') ?? '';

  if (!digits) return null;

  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

function buildWhatsAppWebUrl(phone: string, message: string) {
  return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

export function ServiceOrderDetailsPage() {
  const { id = '' } = useParams();
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus | ''>('');
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState('');
  const [expectedDeliveryAtError, setExpectedDeliveryAtError] = useState<string | null>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const whatsappWindowRef = useRef<Window | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['ordem-servico', id], queryFn: () => serviceOrdersService.getById(id) });
  const mechanicsQuery = useQuery({
    queryKey: ['mecanicos', 'options'],
    queryFn: () => mechanicsService.list({ page: 1, pageSize: 100, active: true }),
  });
  const mutation = useMutation({
    mutationFn: (status: Parameters<typeof serviceOrdersService.updateStatus>[1]) => serviceOrdersService.updateStatus(id, status),
    onSuccess: (updatedOrder, status) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNextStatus('');
      toast.success('Status atualizado com sucesso.');
      const phone = normalizeWhatsAppPhone(updatedOrder.client?.phone ?? query.data?.client?.phone);
      const clientName = updatedOrder.client?.name ?? query.data?.clientName ?? '';

      if (phone) {
        const whatsappUrl = buildWhatsAppWebUrl(phone, buildServiceOrderStatusMessage(status, clientName));

        if (whatsappWindowRef.current && !whatsappWindowRef.current.closed) {
          whatsappWindowRef.current.location.href = whatsappUrl;
        } else {
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        whatsappWindowRef.current?.close();
        toast.error('Cliente sem telefone cadastrado para abrir o WhatsApp.');
      }

      whatsappWindowRef.current = null;
      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      whatsappWindowRef.current?.close();
      whatsappWindowRef.current = null;
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      toast.error(message || 'Não foi possível atualizar o status da ordem de serviço.');
    },
  });
  const deliveryEstimateMutation = useMutation({
    mutationFn: (value: string) =>
      serviceOrdersService.update(id, {
        expectedDeliveryAt: value || null,
      }),
    onSuccess: () => {
      setExpectedDeliveryAtError(null);
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Previsão de entrega atualizada.');
      query.refetch();
    },
    onError: (error: { message?: string | string[] }) => {
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      const normalizedMessage = message || 'Informe uma data válida para salvar a previsão de entrega.';
      setExpectedDeliveryAtError(normalizedMessage);
      toast.error(normalizedMessage);
    },
  });
  const mechanicMutation = useMutation({
    mutationFn: (mechanicId: string) =>
      serviceOrdersService.update(id, {
        mechanicId: mechanicId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] });
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Mecânico responsável atualizado.');
      query.refetch();
    },
  });

  useEffect(() => {
    setExpectedDeliveryAt(toDateInputValue(query.data?.expectedDeliveryAt));
    setExpectedDeliveryAtError(null);
  }, [query.data?.expectedDeliveryAt]);

  useEffect(() => {
    setSelectedMechanicId(query.data?.mechanicId ?? '');
  }, [query.data?.mechanicId]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const budgetLaborItems = (query.data.budgetItems ?? []).filter(
    (item) => item.type === 'LABOR' || item.type === 'LABOR_AND_PART',
  );
  const appliedBudgetParts = (query.data.budgetItems ?? []).filter(
    (item) => (item.type === 'PART' || item.type === 'LABOR_AND_PART') && item.inventoryItem,
  );
  const appliedParts =
    query.data.parts?.length
      ? query.data.parts.map((part) => ({
          id: part.id,
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          totalPrice: part.totalPrice,
          inventoryItem: part.inventoryItem,
        }))
      : appliedBudgetParts.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          inventoryItem: item.inventoryItem!,
        }));
  const mechanicOptions = mechanicsQuery.data?.data ?? [];
  const canGeneratePdf = query.data.status === 'ENTREGUE';
  const minExpectedDeliveryAt = getTodayDateInputMin();

  const handleSaveExpectedDeliveryAt = () => {
    const validationError = validateExpectedDeliveryAtValue(expectedDeliveryAt);

    if (validationError) {
      setExpectedDeliveryAtError(validationError);
      toast.error(validationError);
      return;
    }

    setExpectedDeliveryAtError(null);
    deliveryEstimateMutation.mutate(expectedDeliveryAt);
  };

  const handleGeneratePdf = async () => {
    if (!canGeneratePdf) {
      toast.error('O PDF só pode ser gerado quando a ordem de serviço estiver entregue.');
      return;
    }

    setIsGeneratingPdf(true);

    try {
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
        const lines = pdf.splitTextToSize(text, maxWidth - indent);
        lines.forEach((line: string) => {
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
        `Cliente: ${query.data.clientName}`,
        `Telefone: ${formatPhone(query.data.client?.phone)}`,
        `Veículo: ${query.data.vehicleLabel}`,
        `Status: ${formatServiceOrderStatusLabel(query.data.status)}`,
        `Previsão de entrega: ${query.data.expectedDeliveryAt ? formatDateOnly(query.data.expectedDeliveryAt) : 'Não informada'}`,
        `Mecânico responsável: ${query.data.mechanicName ?? '-'}`,
        `Valor a ser pago pelo cliente: ${formatCurrency(query.data.total ?? 0)}`,
      ]);

      addSectionTitle('Problema relatado');
      addWrappedText(query.data.problemDescription || '-');

      addSectionTitle('Observações');
      addWrappedText(query.data.notes || '-');

      addSectionTitle('Serviços executados');
      if (budgetLaborItems.length) {
        budgetLaborItems.forEach((item) => {
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

      pdf.save(`detalhes-da-execucao-${formatServiceOrderNumber(query.data.orderNumber)}.pdf`);
      toast.success('PDF gerado com sucesso.');
    } catch {
      toast.error('Não foi possível gerar o PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleUpdateStatus = () => {
    if (!nextStatus || nextStatus === query.data.status) {
      return;
    }

    whatsappWindowRef.current = window.open('about:blank', '_blank');
    mutation.mutate(nextStatus);
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Ordem de serviço ${formatServiceOrderNumber(query.data.orderNumber)}`}
        description={`${query.data.clientName} • ${query.data.vehicleLabel}`}
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card>
          <CardHeader>
          <CardTitle>Relatório da Execução</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p><span className="font-medium">Cliente:</span> {query.data.clientName}</p>
            <p><span className="font-medium">Telefone:</span> {formatPhone(query.data.client?.phone)}</p>
            <p><span className="font-medium">Veículo:</span> {query.data.vehicleLabel}</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <StatusBadge status={query.data.status} />
            </div>
            <p><span className="font-medium">Problema relatado:</span> {query.data.problemDescription}</p>
            <div className="space-y-2">
              <p className="font-medium">Serviços executados</p>
              {budgetLaborItems.length ? (
                budgetLaborItems.map((item) => (
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
              {query.data.expectedDeliveryAt ? formatDateOnly(query.data.expectedDeliveryAt) : 'Não informada'}
            </p>
            <p><span className="font-medium">Mecânico responsável:</span> {query.data.mechanicName ?? '-'}</p>
            <p><span className="font-medium">Valor a ser pago pelo cliente:</span> {formatCurrency(query.data.total ?? 0)}</p>
            <p><span className="font-medium">Observações:</span> {query.data.notes ?? '-'}</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Ações da OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mecânico responsável</Label>
              <Select disabled={mechanicsQuery.isLoading || mechanicMutation.isPending} onValueChange={setSelectedMechanicId} value={selectedMechanicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um mecânico" />
                </SelectTrigger>
                <SelectContent>
                  {mechanicOptions.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.id}>
                      {mechanic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                disabled={mechanicsQuery.isLoading || mechanicMutation.isPending}
                variant="outline"
                onClick={() => mechanicMutation.mutate(selectedMechanicId)}
              >
                {mechanicMutation.isPending ? 'Salvando mecânico...' : 'Salvar mecânico'}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryAt">Previsão de entrega</Label>
              <Input
                id="expectedDeliveryAt"
                type="date"
                min={minExpectedDeliveryAt}
                value={expectedDeliveryAt}
                onChange={(event) => {
                  const value = event.target.value;
                  setExpectedDeliveryAt(value);
                  setExpectedDeliveryAtError(validateExpectedDeliveryAtValue(value));
                }}
              />
              {expectedDeliveryAtError ? <p className="text-xs text-destructive">{expectedDeliveryAtError}</p> : null}
              <Button
                className="w-full"
                disabled={deliveryEstimateMutation.isPending}
                variant="outline"
                onClick={handleSaveExpectedDeliveryAt}
              >
                {deliveryEstimateMutation.isPending ? 'Salvando previsão...' : 'Salvar previsão'}
              </Button>
            </div>
            <Select onValueChange={(value) => setNextStatus(value as ServiceOrderStatus)} value={nextStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ABERTA">Aberta</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                <SelectItem value="ENTREGUE">Entregue</SelectItem>
              </SelectContent>
            </Select>
            <Button
              disabled={mutation.isPending || !nextStatus || nextStatus === query.data.status}
              className="w-full"
              onClick={handleUpdateStatus}
            >
              {mutation.isPending ? 'Salvando status...' : 'Salvar status e abrir WhatsApp'}
            </Button>
            <Button className="w-full" disabled={!canGeneratePdf || isGeneratingPdf} variant="outline" onClick={handleGeneratePdf}>
              {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
