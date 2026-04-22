import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Falha ao carregar os dados',
  description = 'Tente novamente em alguns instantes.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-destructive" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        {onRetry ? <Button onClick={onRetry}>Tentar novamente</Button> : null}
      </CardContent>
    </Card>
  );
}
