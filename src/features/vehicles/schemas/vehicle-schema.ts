import { z } from 'zod';

export const vehicleSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  plate: z.string().min(7, 'Informe a placa'),
  brand: z.string().min(2, 'Informe a marca'),
  model: z.string().min(2, 'Informe o modelo'),
  year: z.coerce.number().min(1900).max(2100),
  color: z.string().optional(),
  mileage: z.coerce.number().optional(),
  fuel: z.string().optional(),
  notes: z.string().optional(),
});

export type VehicleSchema = z.infer<typeof vehicleSchema>;
