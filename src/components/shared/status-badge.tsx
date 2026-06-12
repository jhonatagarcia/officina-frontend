import { Badge } from '@/components/ui/badge';

const variantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  APROVADO: 'success',
  PAGO: 'success',
  ENTREGUE: 'success',
  FINALIZADA: 'success',
  OK: 'success',
  RECEIVABLE: 'info',
  PART: 'info',
  PAYABLE: 'warning',
  EM_ANDAMENTO: 'warning',
  ABERTA: 'warning',
  AGUARDANDO_PECA: 'warning',
  LABOR: 'warning',
  PENDENTE: 'warning',
  BAIXO: 'warning',
  REPROVADO: 'danger',
  CRITICO: 'danger',
  VENCIDO: 'danger',
};

const labelMap: Record<string, string> = {
  FINALIZADA: 'Finalizada',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_PECA: 'Aguardando peça',
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

const classNameMap: Record<string, string> = {
  ABERTA: 'border-transparent bg-muted text-stone-400',
  AGUARDANDO_PECA: 'border-transparent bg-amber-500/10 text-amber-500',
};

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  return (
    <Badge className={classNameMap[normalizedStatus]} variant={variantMap[normalizedStatus] ?? 'default'}>
      {labelMap[normalizedStatus] ?? status.replace(/_/g, ' ')}
    </Badge>
  );
}
