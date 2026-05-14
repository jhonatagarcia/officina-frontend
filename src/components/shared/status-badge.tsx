import { Badge } from '@/components/ui/badge';

const variantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  APROVADO: 'success',
  PAGO: 'success',
  ENTREGUE: 'success',
  FINALIZADA: 'success',
  RECEIVABLE: 'info',
  PAYABLE: 'warning',
  EM_ANDAMENTO: 'warning',
  ABERTA: 'warning',
  PART: 'info',
  LABOR: 'warning',
  PENDENTE: 'warning',
  REPROVADO: 'danger',
  CRITICO: 'danger',
  VENCIDO: 'danger',
  BAIXO: 'warning',
  OK: 'success',
};

const labelMap: Record<string, string> = {
  FINALIZADA: 'Finalizada',
  EM_ANDAMENTO: 'Em andamento',
  RECEIVABLE: 'Receber',
  PAYABLE: 'Pagar',
  PART: 'Peça',
  LABOR: 'Mão de obra',
  ABERTA: 'Aberta',
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  ENTREGUE: 'Entregue',
  PAGO: 'Pago',
  VENCIDO: 'Vencido',
  CRITICO: 'Crítico',
  BAIXO: 'Baixo',
  OK: 'OK',
};

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  return (
    <Badge variant={variantMap[normalizedStatus] ?? 'default'}>
      {labelMap[normalizedStatus] ?? status.replace(/_/g, ' ')}
    </Badge>
  );
}
