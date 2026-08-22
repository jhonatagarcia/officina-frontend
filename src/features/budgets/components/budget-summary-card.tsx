import { FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface BudgetSummaryCardProps {
  itemsCount: number;
  discount: number;
  total: number;
  canGeneratePdf?: boolean | undefined;
  isGeneratingPdf?: boolean | undefined;
  onGeneratePdf?: (() => void) | undefined;
}

export function BudgetSummaryCard({
  itemsCount,
  discount,
  total,
  canGeneratePdf = false,
  isGeneratingPdf = false,
  onGeneratePdf,
}: BudgetSummaryCardProps) {
  return (
    <Card className="bg-card shadow-xs">
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
        {canGeneratePdf ? (
          <Button
            className="mt-2 min-h-11 w-full rounded-xl font-semibold"
            disabled={isGeneratingPdf}
            type="button"
            variant="outline"
            onClick={onGeneratePdf}
          >
            <FileDown className="size-4" strokeWidth={1.75} />
            {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF do orçamento'}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
