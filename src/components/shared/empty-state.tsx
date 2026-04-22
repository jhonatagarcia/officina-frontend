import { Inbox } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyState({
  title = 'Nenhum registro encontrado',
  description = 'Ajuste os filtros ou cadastre um novo item.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="flex h-40 flex-col items-center justify-center gap-3 text-center">
        <Inbox className="size-8 text-muted-foreground" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
