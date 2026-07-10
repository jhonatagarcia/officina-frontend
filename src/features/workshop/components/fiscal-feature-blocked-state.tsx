import { LockKeyhole, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WORKSHOP_PROFILE_PATH } from '@/features/workshop/hooks/use-workshop-fiscal-status';

interface FiscalFeatureBlockedStateProps {
  featureName: string;
}

export function FiscalFeatureBlockedState({ featureName }: FiscalFeatureBlockedStateProps) {
  return (
    <Card className="border-amber-200 bg-card">
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <LockKeyhole className="size-7" aria-hidden="true" />
        </div>
        <div className="mt-5 max-w-xl">
          <p className="text-lg font-semibold text-foreground">{featureName} bloqueado temporariamente</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Esta funcionalidade exige o CNPJ do negócio cadastrado. Cadastre o CNPJ para continuar usando recursos fiscais.
          </p>
        </div>
        <Button asChild className="mt-6">
          <Link to={WORKSHOP_PROFILE_PATH}>
            Cadastrar CNPJ
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
