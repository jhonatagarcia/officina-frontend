import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

export function SummaryCard({ title, value, icon: Icon }: SummaryCardProps) {
  return (
    <Card className="shadow-panel">
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight">{value}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
