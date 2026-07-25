import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FiscalFeatureBlockedStateProps {
  featureName: string;
}

export function FiscalFeatureBlockedState({
  featureName,
}: FiscalFeatureBlockedStateProps) {
  return (
    <Card className="border-amber-200 bg-card">
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </div>
        <div className="mt-5 max-w-xl">
          <p className="text-lg font-semibold text-foreground">
            {featureName} disponível sem CNPJ
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            O CNPJ é opcional e não condiciona os recursos operacionais. Emissão
            fiscal não está disponível nesta versão.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
