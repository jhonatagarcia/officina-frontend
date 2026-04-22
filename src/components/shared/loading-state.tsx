import { Card, CardContent } from '@/components/ui/card';

export function LoadingState({ message = 'Carregando dados...' }: { message?: string }) {
  return (
    <Card>
      <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
