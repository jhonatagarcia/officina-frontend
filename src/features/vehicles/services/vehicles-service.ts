import { http } from '@/services/api/http';
import { buildQueryParams, mapPaginatedResponse } from '@/services/api/query-string';
import type { ApiPaginatedResponse, QueryParams } from '@/types/common';
import type { Vehicle, VehicleClientSummary, VehicleHistoryEntry } from '@/features/vehicles/types';
import { toNumber } from '@/lib/utils';

interface VehicleApiResponse {
  id: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  mileage: number | null;
  fuel: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VehicleDetailApiResponse extends VehicleApiResponse {
  client: VehicleClientSummary;
}

interface VehicleHistoryApiResponse {
  id: string;
  vehicleId: string;
  serviceOrderId: string | null;
  entryDate: string;
  mileage: number | null;
  servicesSummary: string;
  partsSummary: string | null;
  totalAmount: number | string | null;
  createdAt: string;
  updatedAt: string;
}

function mapVehicle(vehicle: VehicleApiResponse | VehicleDetailApiResponse): Vehicle {
  return {
    ...vehicle,
    clientName: 'client' in vehicle ? vehicle.client.name : null,
    client: 'client' in vehicle ? vehicle.client : undefined,
  };
}

function mapVehicleHistory(entry: VehicleHistoryApiResponse): VehicleHistoryEntry {
  return {
    ...entry,
    totalAmount: entry.totalAmount === null ? null : toNumber(entry.totalAmount),
  };
}

export const vehiclesService = {
  async list(params: QueryParams) {
    const response = await http.get<ApiPaginatedResponse<VehicleDetailApiResponse>>('/vehicles', {
      params: buildQueryParams(params),
    });

    return mapPaginatedResponse({
      ...response.data,
      data: response.data.data.map(mapVehicle),
    });
  },
  async getById(id: string) {
    const response = await http.get<VehicleDetailApiResponse>(`/vehicles/${id}`);
    return mapVehicle(response.data);
  },
  async create(
    payload: Pick<
      Vehicle,
      'clientId' | 'plate' | 'brand' | 'model' | 'year' | 'color' | 'mileage' | 'fuel' | 'notes'
    >,
  ) {
    const response = await http.post<VehicleApiResponse>('/vehicles', payload);
    return mapVehicle(response.data);
  },
  async update(
    id: string,
    payload: Partial<
      Pick<
        Vehicle,
        'clientId' | 'plate' | 'brand' | 'model' | 'year' | 'color' | 'mileage' | 'fuel' | 'notes'
      >
    >,
  ) {
    const response = await http.patch<VehicleApiResponse>(`/vehicles/${id}`, payload);
    return mapVehicle(response.data);
  },
  async history(id: string) {
    const response = await http.get<VehicleHistoryApiResponse[]>(`/vehicles/${id}/history`);
    return response.data.map(mapVehicleHistory);
  },
};
