import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Eye, FileText, Hash, Mail, Pencil, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clientsService } from '@/features/clients/services/clients-service';
import { useListParams } from '@/hooks/use-list-params';
import { useSortableData } from '@/hooks/use-sortable-data';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { CustomizableSummaryCards } from '@/components/shared/customizable-widgets';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SortableTableHead, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';
import { formatCpfCnpj, formatPhone } from '@/lib/utils';

export function ClientsPage() {
  const navigate = useNavigate();
  const params = useListParams();

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
  const activeClientsCount = clients.filter((client) => client.isActive).length;
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
      title: 'Clientes na página',
      value: String(clients.length),
      icon: Hash,
      mediaClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'active',
      title: 'Ativos na página',
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
  const { sortedItems, sortState, requestSort } = useSortableData(clients, {
    initialSort: { column: 'name', direction: 'asc' },
    accessors: {
      name: (client) => client.name,
      phone: (client) => client.phone,
      document: (client) => client.document,
      email: (client) => client.email,
    },
  });

  return (
    <PageContainer>
      <PageHeader title="Clientes" description="Cadastro e consulta de clientes.">
        <SearchInput
          className="xl:min-w-[260px]"
          value={params.search}
          onChange={params.setSearch}
          placeholder="Buscar por nome, telefone ou CPF/CNPJ"
        />
        <Button className="shrink-0" onClick={() => navigate('/app/clientes/novo')}>Novo cliente</Button>
      </PageHeader>
      <CustomizableSummaryCards
        storageKey="oficina:clientes:summary-cards:v1"
        cards={summaryCards}
        defaultVisibleIds={['total', 'page']}
        gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      />
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && query.data?.data.length === 0 ? <EmptyState /> : null}
          {query.data?.data.length ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="name" sortState={sortState} onSort={requestSort}>Nome</SortableTableHead>
                    <SortableTableHead column="phone" sortState={sortState} onSort={requestSort}>Telefone</SortableTableHead>
                    <SortableTableHead column="document" sortState={sortState} onSort={requestSort}>CPF/CNPJ</SortableTableHead>
                    <SortableTableHead column="email" sortState={sortState} onSort={requestSort}>E-mail</SortableTableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{formatPhone(client.phone)}</TableCell>
                      <TableCell>{formatCpfCnpj(client.document)}</TableCell>
                      <TableCell>{client.email ?? '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/clientes/${client.id}`)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/clientes/${client.id}/editar`)}>
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6">
                <Pagination
                  page={query.data.page}
                  total={query.data.total}
                  pageSize={query.data.pageSize}
                  onPageChange={params.setPage}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
