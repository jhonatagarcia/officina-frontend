import { PropsWithChildren } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function AuthBootstrap({ children }: PropsWithChildren) {
  const hydrated = useAuthStore((state) => state.hydrated);
  return hydrated ? <>{children}</> : null;
}
