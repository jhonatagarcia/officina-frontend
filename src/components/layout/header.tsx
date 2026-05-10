import { LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';

const roleLabelMap: Record<string, string> = {
  ADMIN: 'Administrador',
  ATENDENTE: 'Atendente',
  MECANICO: 'Mecânico',
  FINANCEIRO: 'Financeiro',
};

export function Header() {
  const { session, logout } = useAuthState();
  const queryClient = useQueryClient();

  function handleLogout() {
    queryClient.clear();
    logout();
  }

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 md:px-6 md:pt-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/72 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">Mini SaaS Oficina</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">Central operacional para clientes, ordens de serviço e financeiro.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-border/80 bg-white/80 px-4 py-2 text-right shadow-sm">
            <p className="text-sm font-semibold">{session?.user.name}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{roleLabelMap[session?.user.role ?? ''] ?? session?.user.role}</p>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Sair" className="rounded-2xl bg-white/80">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
