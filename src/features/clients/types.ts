export interface Client {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  vehicles?: ClientVehicleSummary[];
}

export interface ClientVehicleSummary {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  mileage: number | null;
}
