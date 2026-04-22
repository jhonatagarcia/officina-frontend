import { useQuery } from '@tanstack/react-query';
import { Eye, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clientsService } from '@/features/clients/services/clients-service';
import { useListParams } from '@/hooks/use-list-params';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCpfCnpj, formatPhone } from '@/lib/utils';

export function ClientsPage() {
  const navigate = useNavigate();
  const params = useListParams();

  const query = useQuery({
    queryKey: ['clientes', params.page, params.search],
    queryFn: () =>
      clientsService.list({
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
      }),
  });

  return (
    <PageContainer>
      <PageHeader title="Clientes" description="Cadastro e consulta de clientes." actionLabel="Novo cliente" onAction={() => navigate('/app/clientes/novo')}>
        <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por nome, telefone ou CPF/CNPJ" />
      </PageHeader>

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
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((client) => (
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
