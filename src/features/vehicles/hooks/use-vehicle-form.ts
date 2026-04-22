import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { vehicleSchema, type VehicleSchema } from '@/features/vehicles/schemas/vehicle-schema';
import { vehiclesService } from '@/features/vehicles/services/vehicles-service';
import { normalizeNullableString, normalizePlate } from '@/lib/utils';
import { ApiErrorResponse } from '@/types/common';

export function useVehicleForm(mode: 'create' | 'edit' | 'view', id: string, onSuccess: () => void) {
  const query = useQuery({
    queryKey: ['veiculo', id],
    queryFn: () => vehiclesService.getById(id),
    enabled: mode !== 'create',
  });

  const form = useForm<VehicleSchema>({
    resolver: zodResolver(vehicleSchema),
    values:
      (query.data && {
        clientId: query.data.clientId,
        plate: query.data.plate,
        brand: query.data.brand,
        model: query.data.model,
        year: query.data.year,
        color: query.data.color ?? '',
        mileage: query.data.mileage ?? 0,
        fuel: query.data.fuel ?? '',
        notes: query.data.notes ?? '',
      }) ?? {
        clientId: '',
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        mileage: 0,
        fuel: '',
        notes: '',
      },
  });

  const mutation = useMutation({
    mutationFn: async (values: VehicleSchema) => {
      const payload = {
        ...values,
        plate: normalizePlate(values.plate),
        color: normalizeNullableString(values.color),
        mileage: values.mileage || null,
        fuel: normalizeNullableString(values.fuel),
        notes: normalizeNullableString(values.notes),
      };
      if (mode === 'edit') return vehiclesService.update(id, payload);
      return vehiclesService.create(payload);
    },
    onSuccess: () => {
      toast.success('Veículo salvo com sucesso.');
      onSuccess();
    },

      onError: (error: ApiErrorResponse) => {
        if (error.statusCode === 409) {
          form.setError('plate', {
            type: 'server',
            message: error.message || 'Já existe um veículo cadastrado com esta placa.'
          })
        }
        toast.error(error.message || 'Não foi possível salvar o veículo.')
      }
  });

  return { query, form, mutation };
}
