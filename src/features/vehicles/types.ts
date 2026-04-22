export interface Vehicle {
  id: string;
  clientId: string;
  clientName: string | null;
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
  client?: VehicleClientSummary;
}

export interface VehicleClientSummary {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
}

export interface VehicleHistoryEntry {
  id: string;
  vehicleId: string;
  serviceOrderId: string | null;
  entryDate: string;
  mileage: number | null;
  servicesSummary: string;
  partsSummary: string | null;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string;
}
