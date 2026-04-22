import { Badge } from '@/components/ui/badge';

const variantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  APROVADO: 'success',
  PAGO: 'success',
  ENTREGUE: 'success',
  FINALIZADA: 'success',
  RECEIVABLE: 'info',
  PAYABLE: 'warning',
  EM_ANDAMENTO: 'warning',
  ABERTA: 'default',
  PART: 'info',
  LABOR: 'warning',
  PENDENTE: 'default',
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
  return <Badge variant={variantMap[status] ?? 'default'}>{labelMap[status] ?? status.replace(/_/g, ' ')}</Badge>;
}
