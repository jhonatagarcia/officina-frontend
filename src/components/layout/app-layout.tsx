import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
