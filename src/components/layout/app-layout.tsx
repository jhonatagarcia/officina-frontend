import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';

export function AppLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  useEffect(() => {
    if (!isNavigationOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isNavigationOpen]);

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[296px_1fr]">
        <Sidebar
          isOpen={isNavigationOpen}
          onClose={() => setIsNavigationOpen(false)}
        />
        {isNavigationOpen ? (
          <button
            type="button"
            aria-label="Fechar menu de navegação"
            className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-sm lg:hidden"
            onClick={() => setIsNavigationOpen(false)}
          />
        ) : null}
        <div className="relative flex min-h-screen min-w-0 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/60 via-white/25 to-transparent" />
          <Header />
          <main className="relative z-10 flex-1 px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-5 lg:pb-10">
            <div className="mx-auto min-w-0 max-w-7xl">
              <Outlet />
            </div>
          </main>
          {!isNavigationOpen ? (
            <Button
              type="button"
              aria-label="Abrir menu de navegação"
              aria-controls="primary-navigation"
              aria-expanded="false"
              className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-30 h-12 rounded-full border border-orange-300/35 bg-gradient-to-r from-orange-500 to-rose-500 px-4 font-semibold text-white shadow-[0_16px_38px_rgba(249,115,22,0.42)] backdrop-blur transition hover:brightness-105 focus-visible:ring-white lg:hidden"
              onClick={() => setIsNavigationOpen(true)}
            >
              <Menu className="size-5" />
              Menu
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
