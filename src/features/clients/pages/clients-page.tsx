import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { CheckCircle2, Eye, FileText, Hash, Mail, Pencil, Users, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clientsService } from '@/features/clients/services/clients-service';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { CustomizableSummaryCards } from '@/components/shared/customizable-widgets';
import { IndicatorHeaderActions } from '@/components/shared/indicator-header-actions';
import { TableFilterChips } from '@/components/shared/table-filter-chips';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';
import { cn, formatCpfCnpj, formatPhone, formatDateOnly } from '@/lib/utils';

function InfoChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-stone-100 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground">
      {children}
    </span>
  );
}

function ClientStatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold',
        isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-700',
      )}
    >
      <span className={cn('size-2 rounded-full', isActive ? 'bg-emerald-500' : 'bg-stone-400')} />
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function ClientsTableHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TableHead className={cn('h-14 px-6 text-[13px] font-bold tracking-[0.1em] text-muted-foreground', className)}>
      {children}
    </TableHead>
  );
}

function ClientsTableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <TableCell className={cn('px-6 py-5 text-base', className)}>{children}</TableCell>;
}

export function ClientsPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const [isConfiguringPanel, setIsConfiguringPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const query = useQuery({
    queryKey: ['clientes', params.page, DEFAULT_TABLE_PAGE_SIZE, params.search],
    queryFn: () =>
      clientsService.list({
        page: params.page,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        search: params.search,
      }),
  });
  const clients = query.data?.data ?? [];
  const filteredClients = clients.filter((client) => {
    if (activeFilter === 'ALL') return true;
    return activeFilter === 'ACTIVE' ? client.isActive : !client.isActive;
  });
  const activeClientsCount = clients.filter((client) => client.isActive).length;
  const inactiveClientsCount = clients.filter((client) => !client.isActive).length;
  const clientsWithDocumentCount = clients.filter((client) => client.document).length;
  const clientsWithEmailCount = clients.filter((client) => client.email).length;
  const summaryCards = [
    {
      id: 'total',
      title: 'Clientes cadastrados',
      value: String(query.data?.total ?? 0),
      icon: Users,
      mediaClassName: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'page',
      title: 'Clientes nesta página',
      value: String(clients.length),
      icon: Hash,
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      id: 'active',
      title: 'Ativos nesta página',
      value: String(activeClientsCount),
      icon: CheckCircle2,
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'document',
      title: 'Com CPF/CNPJ',
      value: String(clientsWithDocumentCount),
      icon: FileText,
      mediaClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      id: 'email',
      title: 'Com e-mail',
      value: String(clientsWithEmailCount),
      icon: Mail,
      mediaClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    },
  ];
  const { sortedItems, sortState, requestSort } = useSortableData(filteredClients, {
    initialSort: { column: 'name', direction: 'asc' },
    accessors: {
      name: (client) => client.name,
      phone: (client) => client.phone,
      document: (client) => client.document,
      email: (client) => client.email,
      updatedAt: (client) => new Date(client.updatedAt),
    },
  });

  return (
    <PageContainer>
      <PageHeader title="Clientes" description="Cadastro e consulta de clientes.">
        <IndicatorHeaderActions
          onAdjustPanel={() => setIsConfiguringPanel((current) => !current)}
          primaryActionLabel="Novo cliente"
          onPrimaryAction={() => navigate('/app/clientes/novo')}
        >
          <SearchInput
            className="xl:min-w-[260px]"
            value={params.search}
            onChange={params.setSearch}
            placeholder="Buscar por nome, celular ou CPF/CNPJ"
          />
        </IndicatorHeaderActions>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:clientes:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['total', 'active', 'document']}
        gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        isConfiguring={isConfiguringPanel}
        onConfiguringChange={setIsConfiguringPanel}
        showHeaderAction={false}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border-soft p-5">
          <div>
            <CardTitle className="text-lg">Clientes cadastrados</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Lista de clientes com contato, documento e vínculo de veículos.</p>
          </div>
          <Button className="rounded-lg bg-white font-semibold" size="sm" variant="outline" onClick={() => navigate('/app/clientes/novo')}>
            Novo cliente
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && query.data?.data.length === 0 ? <EmptyState /> : null}
          {query.data ? (
            <div>
              <TableFilterChips
                value={activeFilter}
                options={[
                  { value: 'ALL', label: 'Todos', count: clients.length, icon: Users, tone: 'slate' },
                  { value: 'ACTIVE', label: 'Ativos', count: activeClientsCount, icon: CheckCircle2, tone: 'emerald' },
                  { value: 'INACTIVE', label: 'Inativos', count: inactiveClientsCount, icon: XCircle, tone: 'rose' },
                ]}
                onChange={(value) => setActiveFilter(value)}
              />
              {sortedItems.length ? (
                <>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[980px] text-base">
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      className="h-14 px-6 text-[13px] font-bold tracking-[0.1em] text-muted-foreground"
                      column="name"
                      sortState={sortState}
                      onSort={requestSort}
                    >
                      Cliente
                    </SortableTableHead>
                    <SortableTableHead
                      className="h-14 px-6 text-[13px] font-bold tracking-[0.1em] text-muted-foreground"
                      column="phone"
                      sortState={sortState}
                      onSort={requestSort}
                    >
                      Contato
                    </SortableTableHead>
                    <SortableTableHead
                      className="h-14 px-6 text-[13px] font-bold tracking-[0.1em] text-muted-foreground"
                      column="document"
                      sortState={sortState}
                      onSort={requestSort}
                    >
                      CPF/CNPJ
                    </SortableTableHead>
                    <ClientsTableHead>Status</ClientsTableHead>
                    <SortableTableHead
                      className="h-14 px-6 text-[13px] font-bold tracking-[0.1em] text-muted-foreground"
                      column="updatedAt"
                      sortState={sortState}
                      onSort={requestSort}
                    >
                      Atualizado
                    </SortableTableHead>
                    <ClientsTableHead className="text-right">Ações</ClientsTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((client) => (
                    <TableRow key={client.id} className="hover:bg-stone-50/80">
                      <ClientsTableCell>
                        <div className="space-y-1">
                          <p className="font-bold text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email ?? 'Sem e-mail cadastrado'}</p>
                        </div>
                      </ClientsTableCell>
                      <ClientsTableCell>
                        <span className="font-medium">{formatPhone(client.phone)}</span>
                      </ClientsTableCell>
                      <ClientsTableCell>
                        {client.document ? <InfoChip>{formatCpfCnpj(client.document)}</InfoChip> : <span className="text-muted-foreground">-</span>}
                      </ClientsTableCell>
                      <ClientsTableCell>
                        <ClientStatusPill isActive={client.isActive} />
                      </ClientsTableCell>
                      <ClientsTableCell className="text-muted-foreground">{formatDateOnly(client.updatedAt)}</ClientsTableCell>
                      <ClientsTableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button className="rounded-lg bg-white" size="icon-sm" variant="outline" onClick={() => navigate(`/app/clientes/${client.id}`)}>
                            <Eye className="size-4" strokeWidth={1.75} />
                          </Button>
                          <Button className="rounded-lg bg-white" size="icon-sm" variant="outline" onClick={() => navigate(`/app/clientes/${client.id}/editar`)}>
                            <Pencil className="size-4" strokeWidth={1.75} />
                          </Button>
                        </div>
                      </ClientsTableCell>
                    </TableRow>
                  ))}
                </TableBody>
                    </Table>
                  </div>
                  <div className="p-5">
                    <Pagination
                      page={query.data.page}
                      total={query.data.total}
                      pageSize={query.data.pageSize}
                      onPageChange={params.setPage}
                    />
                  </div>
                </>
              ) : (
                <EmptyState />
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
