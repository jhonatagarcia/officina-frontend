import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import { useWorkshopProfile } from '@/features/workshop/hooks/use-workshop-profile';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const { session } = useAuthState();
  const workshopQuery = useWorkshopProfile();
  const workshopName = workshopQuery.data?.tradeName ?? session?.user.workshop?.tradeName ?? session?.user.workshop?.name ?? 'AutoPro System';

  return (
    <header className="sticky top-0 z-30 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-4 sm:pt-4 md:px-6 md:pt-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[20px] border border-white/70 bg-white/72 px-3 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 sm:gap-4 sm:rounded-[28px] sm:px-5 sm:py-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">{workshopName}</p>
          <p className="mt-1 hidden truncate text-sm text-muted-foreground sm:block">Central operacional para clientes, ordens de serviço e financeiro.</p>
        </div>
        <ThemeToggle className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary" />
      </div>
    </header>
  );
}
