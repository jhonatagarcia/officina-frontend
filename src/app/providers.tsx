import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';
import { Toaster } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthBootstrap } from '@/features/auth/components/auth-bootstrap';
import { AuthEffects } from '@/features/auth/components/auth-effects';
import { ErrorState } from '@/components/shared/error-state';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <HelmetProvider>
      <ErrorBoundary
        fallbackRender={() => (
          <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <ErrorState
              title="Ocorreu um erro inesperado"
              description="Recarregue a aplicação. Se o problema persistir, verifique a configuração do ambiente."
            />
          </div>
        )}
      >
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthBootstrap />
            {children}
            <AuthEffects />
            <Toaster richColors position="top-right" />
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
