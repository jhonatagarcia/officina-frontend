import { useQuery } from '@tanstack/react-query';
import { vehiclesService } from '@/features/vehicles/services/vehicles-service';
import { formatPlate } from '@/lib/utils';

export function useVehicleOptions() {
  return useQuery({
    queryKey: ['reference', 'veiculos', 'options'],
    queryFn: async () => {
      const response = await vehiclesService.list({ page: 1, pageSize: 100 });
      return response.data.map((vehicle) => ({
        label: `${formatPlate(vehicle.plate)} • ${vehicle.brand} ${vehicle.model}`,
        value: vehicle.id,
        clientId: vehicle.clientId,
      }));
    },
  });
}
