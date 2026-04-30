import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[296px_1fr]">
        <Sidebar />
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/60 via-white/25 to-transparent" />
          <Header />
          <main className="relative z-10 flex-1 px-4 pb-8 pt-4 md:px-6 md:pb-10 md:pt-5">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
