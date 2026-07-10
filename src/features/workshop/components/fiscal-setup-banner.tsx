import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWorkshopFiscalStatus } from '@/features/workshop/hooks/use-workshop-fiscal-status';

export function FiscalSetupBanner() {
  const fiscalStatus = useWorkshopFiscalStatus();

  if (!fiscalStatus.isIncomplete) return null;

  return (
    <div className="relative z-10 px-4 pt-4 md:px-6">
      <div
        className="mx-auto flex max-w-7xl flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/85 px-4 py-3 text-amber-950 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between"
        role="status"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Cadastro fiscal incompleto</p>
            <p className="text-sm text-amber-900/80">
              Complete o CNPJ do negócio para liberar funcionalidades fiscais. O restante do sistema continua disponível.
            </p>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="shrink-0 border-amber-300 bg-card text-amber-950 hover:bg-card/80 dark:border-amber-400/70 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
        >
          <Link to={fiscalStatus.ctaPath}>
            Cadastrar CNPJ
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
