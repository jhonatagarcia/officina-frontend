import { PropsWithChildren } from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IndicatorHeaderActionsProps extends PropsWithChildren {
  onAdjustPanel: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export function IndicatorHeaderActions({
  children,
  onAdjustPanel,
  primaryActionLabel,
  onPrimaryAction,
}: IndicatorHeaderActionsProps) {
  return (
    <>
      {children}
      <Button
        className="min-h-11 rounded-xl border-border bg-white/90 px-4 font-semibold shadow-xs"
        type="button"
        variant="outline"
        onClick={onAdjustPanel}
      >
        <Settings2 className="size-4" strokeWidth={1.75} />
        Ajustar painel
      </Button>
      {primaryActionLabel ? (
        <Button
          className="min-h-11 rounded-xl bg-[linear-gradient(135deg,#F77139_0%,#E04618_100%)] px-5 font-semibold text-white shadow-[0_12px_24px_rgba(224,70,24,0.22)] hover:brightness-105"
          type="button"
          onClick={onPrimaryAction}
        >
          <Plus className="size-4" strokeWidth={1.75} />
          {primaryActionLabel}
        </Button>
      ) : null}
    </>
  );
}
