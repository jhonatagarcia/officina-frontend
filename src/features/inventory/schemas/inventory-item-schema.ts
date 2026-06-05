import { z } from 'zod';

export const inventoryItemSchema = z.object({
  name: z.string().min(2, 'Informe o nome da peça'),
  category: z.string().optional().or(z.literal('')),
  supplier: z.string().optional().or(z.literal('')),
  quantity: z.coerce.number().min(0, 'A quantidade não pode ser negativa'),
  minimumQuantity: z.coerce.number().min(0, 'O estoque mínimo não pode ser negativo'),
  cost: z.coerce.number().min(0, 'O custo não pode ser negativo'),
  salePrice: z.coerce.number().min(0, 'O preço de venda não pode ser negativo'),
});

export type InventoryItemSchema = z.infer<typeof inventoryItemSchema>;
