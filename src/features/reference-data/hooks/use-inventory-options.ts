import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/features/inventory/services/inventory-service';

export function useInventoryOptions() {
  return useQuery({
    queryKey: ['reference', 'estoque', 'options'],
    queryFn: async () => {
      const response = await inventoryService.list({ page: 1, pageSize: 100 });
      return response.data.map((item) => ({
        label: `${item.internalCode} • ${item.name}`,
        value: item.id,
        name: item.name,
        internalCode: item.internalCode,
        salePrice: item.salePrice,
      }));
    },
  });
}
