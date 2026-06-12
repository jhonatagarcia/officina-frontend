import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import { useWorkshopProfile } from '@/features/workshop/hooks/use-workshop-profile';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const { session } = useAuthState();
  const workshopQuery = useWorkshopProfile();
  const workshopName = workshopQuery.data?.tradeName ?? session?.user.workshop?.tradeName ?? session?.user.workshop?.name ?? 'Mini SaaS Oficina';

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 md:px-6 md:pt-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/72 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">{workshopName}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">Central operacional para clientes, ordens de serviço e financeiro.</p>
        </div>
        <ThemeToggle className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary" />
      </div>
    </header>
  );
}
