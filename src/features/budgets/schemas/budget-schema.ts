import { z } from 'zod';

export const budgetItemSchema = z.object({
  type: z.enum(['PART', 'LABOR', 'LABOR_AND_PART']),
  serviceCatalogItemId: z.string().optional().or(z.literal('')),
  inventoryItemId: z.string().optional().or(z.literal('')),
  serviceCode: z.string().optional().or(z.literal('')),
  description: z.string().min(3, 'Informe a descrição'),
  quantity: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  unitPrice: z.coerce.number().nonnegative('Valor inválido'),
}).superRefine((item, ctx) => {
  if ((item.type === 'LABOR' || item.type === 'LABOR_AND_PART') && !item.serviceCatalogItemId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['serviceCatalogItemId'],
      message: 'Selecione um serviço',
    });
  }

  if ((item.type === 'PART' || item.type === 'LABOR_AND_PART') && !item.inventoryItemId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['inventoryItemId'],
      message: 'Selecione uma peça ou produto',
    });
  }
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
