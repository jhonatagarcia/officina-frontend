import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Eye, Pencil, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { SummaryCard } from '@/components/shared/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { servicesService } from '@/features/services/services/services-service';
import { useListParams } from '@/hooks/use-list-params';
import { formatCurrency } from '@/lib/utils';

type ActiveFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

const billingTypeLabelMap = {
  LABOR_ONLY: 'Mão de obra',
  PARTS_AND_LABOR: 'Peças e mão de obra',
  FIXED_PRICE: 'Preço fixo',
} as const;

export function ServicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useListParams();
  const [category, setCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');

  const query = useQuery({
    queryKey: ['servicos', params.page, params.search, category, activeFilter],
    queryFn: () =>
      servicesService.list({
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        category: category || undefined,
        active: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
      }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? servicesService.deactivate(id) : servicesService.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos'] }),
  });

  const listedItems = query.data?.data ?? [];
  const activeCount = listedItems.filter((item) => item.active).length;
  const inactiveCount = listedItems.filter((item) => !item.active).length;

  return (
    <PageContainer>
      <PageHeader title="Serviços" description="Catálogo padronizado de serviços para orçamento e ordem de serviço.">
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchInput value={params.search} onChange={params.setSearch} placeholder="Buscar por nome ou código" />
          <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Filtrar por categoria" />
          <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as ActiveFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Ativos</SelectItem>
              <SelectItem value="INACTIVE">Inativos</SelectItem>
              <SelectItem value="ALL">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => navigate('/app/servicos/novo')}>
            Novo serviço
          </Button>
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Serviços listados" value={String(query.data?.total ?? 0)} icon={Wrench} />
        <SummaryCard title="Ativos na página" value={String(activeCount)} icon={DollarSign} />
        <SummaryCard title="Inativos na página" value={String(inactiveCount)} icon={DollarSign} />
      </div>
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && listedItems.length === 0 ? <EmptyState /> : null}
          {listedItems.length ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Cobrança</TableHead>
                    <TableHead>Total sugerido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>
                        <div>
                          <p>{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description ?? 'Sem descrição cadastrada'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p>{item.category}</p>
                      </TableCell>
                      <TableCell>{billingTypeLabelMap[item.billingType]}</TableCell>
                      <TableCell>{formatCurrency(item.suggestedTotalPrice)}</TableCell>
                      <TableCell>
                        <Badge variant={item.active ? 'success' : 'danger'}>{item.active ? 'Ativo' : 'Inativo'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/servicos/${item.id}`)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => navigate(`/app/servicos/${item.id}/editar`)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={toggleActiveMutation.isPending}
                            onClick={() => toggleActiveMutation.mutate({ id: item.id, active: item.active })}
                          >
                            {item.active ? 'Inativar' : 'Ativar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6">
                <Pagination page={query.data!.page} total={query.data!.total} pageSize={query.data!.pageSize} onPageChange={params.setPage} />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
