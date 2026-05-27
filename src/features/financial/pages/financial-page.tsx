import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, DollarSign, PackageSearch, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { financialService } from '@/features/financial/services/financial-service';
import { useFiscalStatusSocket } from '@/features/financial/hooks/use-fiscal-status-socket';
import type { FinancialEntry, PaymentMethod } from '@/features/financial/types';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { cn, formatCurrency, formatDate, formatServiceOrderNumber } from '@/lib/utils';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { CustomizableSummaryCards } from '@/components/shared/customizable-widgets';
import { IndicatorHeaderActions } from '@/components/shared/indicator-header-actions';
import { PlateChip } from '@/components/shared/table-identity-cells';
import { TableFilterChips } from '@/components/shared/table-filter-chips';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';

function canRegisterPayment(status: string) {
  return status === 'PENDENTE' || status === 'VENCIDO';
}

function canRequestNfse(entry: FinancialEntry) {
  return (
    entry.type === 'RECEIVABLE' &&
    entry.status === 'PAGO' &&
    Boolean(entry.serviceOrderId) &&
    entry.fiscalEmission === null
  );
}

function isPaymentEligibleForNfse(entry: FinancialEntry) {
  return entry.type === 'RECEIVABLE' && Boolean(entry.serviceOrderId);
}

function getFiscalStatusLabel(entry: FinancialEntry) {
  const emission = entry.fiscalEmission;
  if (!emission) return 'Sem NFSe';
  const labels = {
    PENDENTE: 'Pendente',
    PROCESSANDO: 'Processando',
    AUTORIZADA: 'Autorizada',
    REJEITADA: 'Rejeitada',
    CANCELADA: 'Cancelada',
    ERRO_PERMANENTE: 'Erro permanente',
  } as const;
  return labels[emission.status];
}

function getFinancialRowClass(status: string) {
  if (status === 'VENCIDO') return 'bg-rose-50/45 hover:bg-rose-50/70';
  if (status === 'PENDENTE') return 'bg-amber-50/30 hover:bg-amber-50/55';
  return undefined;
}

function getEntryOriginLabel(entry: FinancialEntry) {
  if (entry.serviceOrder) return 'Ordem de serviço';
  return entry.client?.name ?? '-';
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toPaidAtIsoString(value: string) {
  return new Date(`${value}T12:00:00`).toISOString();
}

export function FinancialPage() {
  return <FinancialPageContent />;
}

function FinancialPageContent() {
  useFiscalStatusSocket();
  const params = useListParams();
  const queryClient = useQueryClient();
  const [isConfiguringPanel, setIsConfiguringPanel] = useState(false);
  const [entryToPay, setEntryToPay] = useState<FinancialEntry | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [requestNfseEmission, setRequestNfseEmission] = useState(false);
  const today = toDateInputValue(new Date());
  const query = useQuery({
    queryKey: ['financeiro', params.page, DEFAULT_TABLE_PAGE_SIZE, params.search, params.status],
    queryFn: () =>
      financialService.list({
        page: params.page,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        search: params.search,
      }),
  });
  const summaryQuery = useQuery({
    queryKey: ['financeiro', 'summary'],
    queryFn: financialService.getSummary,
  });
  const mutation = useMutation({
    mutationFn: ({
      id,
      selectedPaymentMethod,
      paidAt,
      requestNfse,
    }: {
      id: string;
      selectedPaymentMethod: PaymentMethod;
      paidAt: string;
      requestNfse: boolean;
    }) =>
      financialService.markAsPaid(id, {
        paymentMethod: selectedPaymentMethod,
        paidAt,
        requestNfseEmission: requestNfse,
      }),
    onSuccess: (updatedEntry) => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEntryToPay(null);
      toast.success('Pagamento registrado.');
      if (updatedEntry.fiscalEmission?.status === 'PENDENTE') {
        toast.success('Solicitacao de NFSe registrada e aguardando processamento.');
      }
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message ?? 'Nao foi possivel registrar o pagamento.'),
  });
  const nfseMutation = useMutation({
    mutationFn: (financialEntryId: string) => financialService.requestNfseEmission(financialEntryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      toast.success('Solicitacao de NFSe registrada e aguardando processamento.');
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message ?? 'Nao foi possivel solicitar a NFSe.'),
  });
  const danfseMutation = useMutation({
    mutationFn: (emissionId: string) => financialService.getDanfseDownload(emissionId),
    onSuccess: (downloadUrl) => {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message ?? 'DANFSE indisponivel para download.'),
  });
  const selectedStatus = params.status || 'ALL';
  const filteredEntries =
    query.data?.data.filter((item) => {
      const matchesStatus = selectedStatus !== 'ALL' ? item.status === selectedStatus : true;
      return matchesStatus;
    }) ?? [];
  const { sortedItems, sortState, requestSort } = useSortableData(filteredEntries, {
    initialSort: { column: 'description', direction: 'asc' },
    accessors: {
      description: (entry) => (entry.serviceOrder ? entry.serviceOrder.orderNumber : entry.description),
      status: (entry) => entry.status,
      amount: (entry) => entry.amount,
      paidAt: (entry) => (entry.paidAt ? new Date(entry.paidAt) : null),
      client: (entry) => entry.client?.name,
      origin: (entry) => getEntryOriginLabel(entry),
    },
  });
  const pagination = query.data;
  const income = summaryQuery.data?.receivablesValue ?? filteredEntries.filter((item) => item.type === 'RECEIVABLE').reduce((acc, item) => acc + item.amount, 0) ?? 0;
  const stockOutValue = summaryQuery.data?.stockOutValue ?? 0;
  const pendingEntriesCount = filteredEntries.filter((item) => item.status === 'PENDENTE').length;
  const paidEntriesCount = filteredEntries.filter((item) => item.status === 'PAGO').length;
  const overdueEntriesCount = filteredEntries.filter((item) => item.status === 'VENCIDO').length;
  const pageTotal = filteredEntries.reduce((total, item) => total + item.amount, 0);
  const summaryCards = [
    {
      id: 'projected-balance',
      title: 'Saldo projetado',
      value: formatCurrency(income - stockOutValue),
      icon: DollarSign,
      valueClassName: 'text-sky-600',
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      id: 'receivables',
      title: 'Contas a receber',
      value: formatCurrency(income),
      icon: TrendingUp,
      valueClassName: 'text-emerald-600',
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'stock-out',
      title: 'Saída de estoque',
      value: formatCurrency(stockOutValue),
      icon: PackageSearch,
      valueClassName: 'text-rose-600',
      mediaClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    {
      id: 'pending',
      title: 'Pendentes na página',
      value: String(pendingEntriesCount),
      icon: Clock,
      mediaClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      id: 'paid',
      title: 'Pagos na página',
      value: String(paidEntriesCount),
      icon: CheckCircle2,
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'overdue',
      title: 'Vencidos na página',
      value: String(overdueEntriesCount),
      icon: AlertTriangle,
      mediaClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    {
      id: 'page-total',
      title: 'Total da página',
      value: formatCurrency(pageTotal),
      icon: DollarSign,
      mediaClassName: 'border-violet-200 bg-violet-50 text-violet-700',
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Financeiro" description="Contas a receber, saída de estoque e conciliação.">
        <IndicatorHeaderActions onAdjustPanel={() => setIsConfiguringPanel((current) => !current)}>
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por descrição ou origem" />
          <Select value={selectedStatus} onValueChange={(value) => params.setStatus(value === 'ALL' ? '' : value)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="VENCIDO">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </IndicatorHeaderActions>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:financeiro:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['projected-balance', 'receivables', 'stock-out']}
        gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        isConfiguring={isConfiguringPanel}
        onConfiguringChange={setIsConfiguringPanel}
        showHeaderAction={false}
      />
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && filteredEntries.length === 0 ? <EmptyState /> : null}
          {query.data ? (
            <TableFilterChips
              value={selectedStatus}
              options={[
                { value: 'ALL', label: 'Todos', count: query.data.data.length, icon: DollarSign, tone: 'slate' },
                { value: 'PENDENTE', label: 'Pendente', count: pendingEntriesCount, icon: Clock, tone: 'amber' },
                { value: 'PAGO', label: 'Pago', count: paidEntriesCount, icon: CheckCircle2, tone: 'emerald' },
                { value: 'VENCIDO', label: 'Vencido', count: overdueEntriesCount, icon: AlertTriangle, tone: 'rose' },
              ]}
              onChange={(value) => params.setStatus(value === 'ALL' ? '' : value)}
            />
          ) : null}
          {filteredEntries.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[1080px]">
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="description" sortState={sortState} onSort={requestSort}>Descrição</SortableTableHead>
                    <SortableTableHead column="status" sortState={sortState} onSort={requestSort}>Status</SortableTableHead>
                    <SortableTableHead column="amount" sortState={sortState} onSort={requestSort}>Valor</SortableTableHead>
                    <SortableTableHead column="paidAt" sortState={sortState} onSort={requestSort}>Data do pagamento</SortableTableHead>
                    <SortableTableHead column="client" sortState={sortState} onSort={requestSort}>Cliente</SortableTableHead>
                    <SortableTableHead column="origin" sortState={sortState} onSort={requestSort}>Origem</SortableTableHead>
                    <TableHead>NFSe</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((entry) => (
                    <TableRow key={entry.id} className={getFinancialRowClass(entry.status)}>
                      <TableCell>
                        {entry.serviceOrder ? <PlateChip>{formatServiceOrderNumber(entry.serviceOrder.orderNumber)}</PlateChip> : entry.description}
                      </TableCell>
                      <TableCell><StatusBadge status={entry.status} /></TableCell>
                      <TableCell className={cn('font-bold [font-variant-numeric:tabular-nums]', entry.status === 'VENCIDO' ? 'text-rose-700' : null)}>
                        {formatCurrency(entry.amount)}
                      </TableCell>
                      <TableCell>
                        {entry.paidAt ? formatDate(entry.paidAt) : '-'}
                      </TableCell>
                      <TableCell>{entry.client?.name ?? '-'}</TableCell>
                      <TableCell>{getEntryOriginLabel(entry)}</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{getFiscalStatusLabel(entry)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {canRegisterPayment(entry.status) ? (
                          <Button
                            size="sm"
                            disabled={mutation.isPending}
                            onClick={() => {
                              setEntryToPay(entry);
                              setPaymentDate(today);
                              setPaymentMethod('PIX');
                              setRequestNfseEmission(false);
                            }}
                          >
                            Registrar pagamento
                          </Button>
                        ) : canRequestNfse(entry) ? (
                          <Button
                            size="sm"
                            disabled={nfseMutation.isPending}
                            onClick={() => nfseMutation.mutate(entry.id)}
                          >
                            Gerar NFSe
                          </Button>
                        ) : entry.fiscalEmission?.status === 'AUTORIZADA' &&
                          entry.fiscalEmission.danfseAvailable ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={danfseMutation.isPending}
                            onClick={() => {
                              if (entry.fiscalEmission) {
                                danfseMutation.mutate(entry.fiscalEmission.id);
                              }
                            }}
                          >
                            Baixar DANFSE
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-5">
                {pagination ? (
                  <Pagination page={pagination.page} total={pagination.total} pageSize={pagination.pageSize} onPageChange={params.setPage} />
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Dialog open={Boolean(entryToPay)} onOpenChange={(open) => !open && setEntryToPay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
            <DialogDescription>
              Confirme o recebimento e escolha se deseja solicitar a NFSe de servicos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Data do pagamento
              <Input
                type="date"
                value={paymentDate || today}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Forma de pagamento
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="CARTAO_CREDITO">Cartao de credito</SelectItem>
                  <SelectItem value="CARTAO_DEBITO">Cartao de debito</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <input
                className="mt-1"
                type="checkbox"
                checked={requestNfseEmission}
                disabled={!entryToPay || !isPaymentEligibleForNfse(entryToPay)}
                onChange={(event) => setRequestNfseEmission(event.target.checked)}
              />
              <span>
                Solicitar emissao da NFSe apos registrar o pagamento
                {!entryToPay || isPaymentEligibleForNfse(entryToPay) ? null : (
                  <span className="mt-1 block text-muted-foreground">
                    Disponivel somente para contas a receber vinculadas a uma OS.
                  </span>
                )}
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryToPay(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!entryToPay || mutation.isPending}
              onClick={() => {
                if (!entryToPay) return;
                mutation.mutate({
                  id: entryToPay.id,
                  selectedPaymentMethod: paymentMethod,
                  paidAt: toPaidAtIsoString(paymentDate || today),
                  requestNfse: requestNfseEmission,
                });
              }}
            >
              Confirmar pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
