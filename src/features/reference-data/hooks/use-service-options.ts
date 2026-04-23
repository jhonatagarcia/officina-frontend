import { useQuery } from '@tanstack/react-query';
import { servicesService } from '@/features/services/services/services-service';

export function useServiceOptions() {
  return useQuery({
    queryKey: ['reference', 'servicos', 'options'],
    queryFn: async () => {
      const response = await servicesService.list({ page: 1, pageSize: 100, active: true });
      return response.data.map((service) => ({
        label: service.name,
        value: service.id,
        code: service.code,
        description: service.description ?? service.name,
        suggestedTotalPrice: service.suggestedTotalPrice,
      }));
    },
  });
}
