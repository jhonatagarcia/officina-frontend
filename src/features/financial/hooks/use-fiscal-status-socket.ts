import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import type { FiscalEmissionStatus } from '@/features/financial/types';
import { env } from '@/lib/env';

interface FiscalEmissionUpdatedEvent {
  readonly event: 'fiscal.emission.updated';
  readonly emissionId: string;
  readonly financialEntryId: string;
  readonly serviceOrderId: string;
  readonly status: FiscalEmissionStatus;
  readonly invoiceNumber?: string;
  readonly rejectionMessage?: string;
  readonly pdfAvailable?: boolean;
  readonly occurredAt: string;
}

const realtimeBaseUrl = env.VITE_API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

export function useFiscalStatusSocket(): void {
  const queryClient = useQueryClient();
  const { session } = useAuthState();

  useEffect(() => {
    if (!session?.accessToken) {
      return undefined;
    }

    const socket = io(`${realtimeBaseUrl}/fiscal`, {
      auth: { token: session.accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('fiscal.emission.updated', (event: FiscalEmissionUpdatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });

      if (event.status === 'AUTORIZADA') {
        toast.success(
          event.invoiceNumber
            ? `NFSe ${event.invoiceNumber} autorizada.`
            : 'NFSe autorizada.',
        );
      } else if (event.status === 'REJEITADA') {
        toast.error(event.rejectionMessage ?? 'NFSe rejeitada. Verifique os dados fiscais.');
      } else if (event.status === 'ERRO_PERMANENTE') {
        toast.error('A emissao da NFSe falhou e requer verificacao.');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, session?.accessToken]);
}
