import { LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';

export function Header() {
  const { session, logout } = useAuthState();

  return (
    <header className="border-b bg-card/90 px-4 py-4 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar cliente, placa, OS..." />
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right">
            <p className="text-sm font-semibold">{session?.user.name}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{session?.user.role}</p>
          </div>
          <Button variant="outline" size="icon" onClick={logout} aria-label="Sair">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
