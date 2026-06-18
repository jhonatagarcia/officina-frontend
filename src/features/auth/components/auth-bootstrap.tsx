import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function AuthBootstrap() {
  const silentRefresh = useAuthStore((state) => state.silentRefresh);

  useEffect(() => {
    void silentRefresh();
  }, [silentRefresh]);

  return null;
}
