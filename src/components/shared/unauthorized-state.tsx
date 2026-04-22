import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <div>
            <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Seu perfil não possui permissão para acessar este módulo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
