import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { vehicleSchema, type VehicleSchema } from '@/features/vehicles/schemas/vehicle-schema';
import { vehiclesService } from '@/features/vehicles/services/vehicles-service';
import type { Vehicle } from '@/features/vehicles/types';
import { normalizeNullableString, normalizePlate } from '@/lib/utils';
import type { ApiErrorResponse, PaginatedResponse } from '@/types/common';

export function useVehicleForm(mode: 'create' | 'edit' | 'view', id: string, onSuccess: () => void) {
  const queryClient = useQueryClient();
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
    onSuccess: (savedVehicle) => {
      queryClient.setQueryData<Vehicle>(['veiculo', savedVehicle.id], (current) => ({
        ...current,
        ...savedVehicle,
        clientName: savedVehicle.clientName ?? current?.clientName ?? null,
        client: savedVehicle.client ?? current?.client,
      }));
      queryClient.setQueriesData<PaginatedResponse<Vehicle>>({ queryKey: ['veiculos'] }, (current) =>
        current
          ? {
              ...current,
              data: current.data.map((vehicle) =>
                vehicle.id === savedVehicle.id
                  ? {
                      ...vehicle,
                      ...savedVehicle,
                      clientName: savedVehicle.clientName ?? vehicle.clientName,
                      client: savedVehicle.client ?? vehicle.client,
                    }
                  : vehicle,
              ),
            }
          : current,
      );
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      queryClient.invalidateQueries({ queryKey: ['veiculo', savedVehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'veiculos'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Veículo salvo com sucesso.');
      onSuccess();
    },
    onError: (error: ApiErrorResponse) => {
      if (error.statusCode === 409) {
        form.setError('plate', {
          type: 'server',
          message: error.message || 'Já existe um veículo cadastrado com esta placa.',
        });
        return;
      }

      toast.error(error.message || 'Não foi possível salvar o veículo.');
    },
  });

  return { query, form, mutation };
}
