import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HandCoins } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { commissionsService } from '@/features/commissions/services/commissions-service';
import type { CommissionLedgerEntryType } from '@/features/commissions/types';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import { mechanicsService } from '@/features/mechanics/services/mechanics-service';
import { formatCurrency } from '@/lib/utils';

const entryLabels: Record<CommissionLedgerEntryType, string> = {
  COMMISSION_EARNED: 'Comissao elegivel',
  COMMISSION_REVERSAL: 'Estorno',
  COMMISSION_ADJUSTMENT_CREDIT: 'Ajuste de credito',
  COMMISSION_ADJUSTMENT_DEBIT: 'Ajuste de debito',
  COMMISSION_NO_IMPACT: 'Sem impacto',
};

export function CommissionsPage() {
  const { role } = useAuthState();
  const isAdmin = role === 'ADMIN';
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState('');
  const [ratePercent, setRatePercent] = useState('0');

  const employeesQuery = useQuery({
    queryKey: ['commission-employees'],
    queryFn: () => mechanicsService.list({ page: 1, pageSize: 100 }),
    enabled: isAdmin,
  });
  useEffect(() => {
    if (!employeeId && employeesQuery.data?.data[0]) {
      setEmployeeId(employeesQuery.data.data[0].id);
    }
  }, [employeeId, employeesQuery.data]);

  const policyQuery = useQuery({
    queryKey: ['commission-policy', employeeId],
    queryFn: () => commissionsService.getPolicy(employeeId),
    enabled: isAdmin && Boolean(employeeId),
  });
  useEffect(() => {
    if (policyQuery.isSuccess) {
      setRatePercent(String((policyQuery.data?.rateBps ?? 0) / 100));
    }
  }, [policyQuery.data, policyQuery.isSuccess]);

  const ledgerQuery = useQuery({
    queryKey: ['commission-ledger', isAdmin ? employeeId : 'me'],
    queryFn: () =>
      isAdmin
        ? commissionsService.listForEmployee(employeeId)
        : commissionsService.listOwn(),
    enabled: !isAdmin || Boolean(employeeId),
  });

  const policyMutation = useMutation({
    mutationFn: () =>
      commissionsService.setPolicy(employeeId, Number(ratePercent)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['commission-policy', employeeId],
      });
      toast.success('Política de comissão salva.');
    },
    onError: () => {
      toast.error('Não foi possível salvar a política de comissão.');
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Comissoes"
        description={
          isAdmin
            ? 'Politicas versionadas e extratos da equipe.'
            : 'Seu extrato de comissao sobre mao de obra paga.'
        }
      />

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Politica do funcionario</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
            <div className="space-y-2">
              <Label>Funcionario</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {employeesQuery.data?.data.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission-rate">Percentual</Label>
              <Input
                id="commission-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={ratePercent}
                onChange={(event) => setRatePercent(event.target.value)}
              />
            </div>
            <Button
              type="button"
              disabled={!employeeId || policyMutation.isPending}
              onClick={() => policyMutation.mutate()}
            >
              {policyMutation.isPending ? 'Salvando...' : 'Salvar politica'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Extrato imutavel</span>
            <span className="flex items-center gap-2 text-base">
              <HandCoins className="size-5" />
              {formatCurrency(ledgerQuery.data?.balance ?? 0)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ledgerQuery.isLoading ? <LoadingState /> : null}
          {ledgerQuery.isError ? (
            <ErrorState onRetry={() => ledgerQuery.refetch()} />
          ) : null}
          {ledgerQuery.data && ledgerQuery.data.data.length === 0 ? (
            <EmptyState
              title="Nenhum evento de comissao"
              description="A comissão é criada quando um lançamento financeiro vinculado à OS é marcado como pago, com uma política já ativa para o funcionário."
            />
          ) : null}
          {ledgerQuery.data?.data.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Base de mao de obra</TableHead>
                    <TableHead>Percentual</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerQuery.data.data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entryLabels[entry.entryType]}</TableCell>
                      <TableCell>
                        {formatCurrency(entry.laborBaseAmount)}
                      </TableCell>
                      <TableCell>
                        {(entry.commissionRateBps / 100).toLocaleString(
                          'pt-BR',
                        )}
                        %
                      </TableCell>
                      <TableCell>{formatCurrency(entry.amount)}</TableCell>
                      <TableCell>
                        {new Date(entry.occurredAt).toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
