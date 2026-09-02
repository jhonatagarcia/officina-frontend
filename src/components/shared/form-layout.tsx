import { PropsWithChildren } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FormSectionHeaderProps {
  eyebrow: string;
  title: string;
  className?: string;
}

export const formPrimaryButtonClassName =
  'rounded-xl bg-[linear-gradient(135deg,#F77139_0%,#E04618_100%)] font-semibold text-white shadow-[0_12px_24px_rgba(224,70,24,0.22)] hover:brightness-105';

export function FormCard({ children }: PropsWithChildren) {
  return (
    <Card className="bg-card shadow-xs">
      <CardContent className="p-4 sm:p-6 lg:p-7">{children}</CardContent>
    </Card>
  );
}

export function FormSectionHeader({
  eyebrow,
  title,
  className,
}: FormSectionHeaderProps) {
  return (
    <div className={cn('md:col-span-2', className)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-bold">{title}</h2>
    </div>
  );
}

export function FormActions({ children }: PropsWithChildren) {
  return <div className="flex flex-col-reverse gap-2 [&>button]:w-full sm:flex-row sm:justify-end sm:[&>button]:w-auto md:col-span-2">{children}</div>;
}
