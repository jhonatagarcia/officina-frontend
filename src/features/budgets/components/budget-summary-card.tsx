import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface BudgetSummaryCardProps {
  itemsCount: number;
  discount: number;
  total: number;
}

export function BudgetSummaryCard({ itemsCount, discount, total }: BudgetSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Itens</span>
          <span>{itemsCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Desconto</span>
          <span>{formatCurrency(discount)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
