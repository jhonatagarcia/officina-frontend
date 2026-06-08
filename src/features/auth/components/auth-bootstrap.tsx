import { PropsWithChildren, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function AuthBootstrap({ children }: PropsWithChildren) {
  const hydrated = useAuthStore((state) => state.hydrated);
  const silentRefresh = useAuthStore((state) => state.silentRefresh);

  useEffect(() => {
    void silentRefresh();
  }, [silentRefresh]);

  return hydrated ? <>{children}</> : null;
}
