import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface BudgetSummaryCardProps {
  itemsCount: number;
  discount: number;
  total: number;
}

export function BudgetSummaryCard({
  itemsCount,
  discount,
  total,
}: BudgetSummaryCardProps) {
  return (
    <Card className="bg-white shadow-xs">
      <CardHeader>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
          Totais
        </p>
        <CardTitle className="text-xl">Resumo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between border-b border-border-soft pb-3 text-sm">
          <span className="text-muted-foreground">Itens</span>
          <span className="font-semibold">{itemsCount}</span>
        </div>
        <div className="flex justify-between border-b border-border-soft pb-3 text-sm">
          <span className="text-muted-foreground">Desconto</span>
          <span className="font-semibold">{formatCurrency(discount)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
