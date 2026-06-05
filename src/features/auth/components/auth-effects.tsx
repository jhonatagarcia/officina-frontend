import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { subscribeAuthEvent } from '@/features/auth/lib/auth-events';

export function AuthEffects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribeAuthEvent((event) => {
      if (event.type === 'SESSION_EXPIRED') {
        queryClient.clear();
        toast.error('Sua sessão expirou. Faça login novamente.');
        navigate('/login', { replace: true });
      }

      if (event.type === 'FORBIDDEN') {
        toast.error('Você não possui permissão para executar esta ação.');
      }
    });
  }, [navigate, queryClient]);

  return null;
}
