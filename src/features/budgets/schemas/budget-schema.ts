import { z } from 'zod';

export const budgetItemSchema = z.object({
  type: z.enum(['PART', 'LABOR']),
  description: z.string().min(3, 'Informe a descrição'),
  quantity: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  unitPrice: z.coerce.number().nonnegative('Valor inválido'),
});

export const budgetSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  vehicleId: z.string().min(1, 'Selecione um veículo'),
  problemDescription: z.string().min(5, 'Descreva o problema relatado'),
  notes: z.string().optional().or(z.literal('')),
  discount: z.coerce.number().nonnegative(),
  items: z.array(budgetItemSchema).min(1, 'Adicione ao menos um item'),
});

export type BudgetSchema = z.infer<typeof budgetSchema>;
