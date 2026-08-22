import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KeyRound, Plus } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usersService } from '@/features/users/services/users-service';
import { CreateAccessUserDialog } from '@/features/users/components/create-access-user-dialog';
import { Button } from '@/components/ui/button';

const roleLabels = {
  ADMIN: 'Administrador',
  ATENDENTE: 'Atendente',
  MECANICO: 'Mecanico',
  FINANCEIRO: 'Financeiro',
};

export function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const query = useQuery({
    queryKey: ['usuarios-acesso'],
    queryFn: () => usersService.list({ page: 1, pageSize: 100 }),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Contas de acesso"
        description="Contas autenticaveis da oficina, separadas dos funcionarios."
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Nova conta
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          {query.isLoading ? <LoadingState /> : null}
          {query.isError ? (
            <ErrorState onRetry={() => query.refetch()} />
          ) : null}
          {query.data && query.data.data.length === 0 ? (
            <EmptyState title="Nenhuma conta encontrada" />
          ) : null}
          {query.data?.data.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ultimo acesso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <KeyRound className="size-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{roleLabels[user.role]}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'success' : 'danger'}>
                          {user.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString('pt-BR')
                          : 'Nunca acessou'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <CreateAccessUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </PageContainer>
  );
}
