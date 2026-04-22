import { NavLink } from 'react-router-dom';
import { env } from '@/lib/env';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import { getSidebarRoutes } from '@/routes/route-manifest';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { role } = useAuthState();
  const menuItems = getSidebarRoutes(role);

  return (
    <aside className="surface-grid border-r bg-card/88 px-5 py-6 backdrop-blur">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">ERP Oficina</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{env.VITE_APP_NAME}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Produtividade operacional para oficina mecânica.</p>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
            <NavLink
              key={item.key}
              to={`/app/${item.path}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary',
                )
              }
            >
              {item.icon ? <item.icon className="size-4" /> : null}
              {item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
