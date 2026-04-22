import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { vehiclesService } from '@/features/vehicles/services/vehicles-service';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

export function VehicleHistoryPage() {
  const { id = '' } = useParams();
  const query = useQuery({
    queryKey: ['veiculos', id, 'historico'],
    queryFn: () => vehiclesService.history(id),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <PageContainer>
      <PageHeader title="Histórico do veículo" description="Linha do tempo de serviços, peças e valores." />
      <Card>
        <CardContent className="space-y-6 p-6">
          {query.data.map((entry) => (
            <div key={entry.id} className="relative border-l pl-6">
              <div className="absolute left-[-6px] top-1 size-3 rounded-full bg-primary" />
              <p className="text-sm text-muted-foreground">
                {formatDate(entry.entryDate)} {entry.mileage ? `• ${entry.mileage} km` : ''}
              </p>
              <h3 className="text-lg font-semibold">{entry.servicesSummary}</h3>
              <p className="text-sm text-muted-foreground">Registro vinculado ao histórico operacional do veículo.</p>
              {entry.partsSummary ? <p className="mt-2 text-sm">Peças: {entry.partsSummary}</p> : null}
              {entry.totalAmount ? <p className="text-sm font-medium">Valor: {formatCurrency(entry.totalAmount)}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
