import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';

export function AuthBootstrap() {
  const silentRefresh = useAuthStore((state) => state.silentRefresh);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setHydrated(true);
      return;
    }

    void silentRefresh();
  }, [location.pathname, setHydrated, silentRefresh]);

  return null;
}
