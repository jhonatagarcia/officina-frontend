import { useQuery } from '@tanstack/react-query';
import { clientsService } from '@/features/clients/services/clients-service';

export function useClientOptions() {
  return useQuery({
    queryKey: ['reference', 'clientes', 'options'],
    queryFn: async () => {
      const response = await clientsService.list({ page: 1, pageSize: 100 });
      return response.data.map((client) => ({ label: client.name, value: client.id }));
    },
  });
}
