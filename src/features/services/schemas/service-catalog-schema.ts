import { z } from 'zod';

const optionalStringField = z.string().optional().or(z.literal(''));

function optionalNumberField(invalidMessage: string) {
  return z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  }, z.number({ invalid_type_error: invalidMessage }).finite(invalidMessage).optional());
}

export const serviceCatalogSchema = z
  .object({
    name: z.string().min(2, 'Informe o nome do serviço'),
    category: z.string().min(2, 'Informe a categoria'),
    description: optionalStringField,
    internalNotes: optionalStringField,
    laborPrice: z.coerce.number().min(0, 'O valor da mão de obra não pode ser negativo'),
    productPrice: z.coerce.number().min(0, 'O valor sugerido de produto/peça não pode ser negativo'),
    billingType: z.enum(['LABOR_ONLY', 'PARTS_AND_LABOR', 'FIXED_PRICE']),
    materialSource: z.enum(['SHOP_SUPPLIES', 'CUSTOMER_SUPPLIES', 'NO_PARTS_REQUIRED', 'FLEXIBLE']),
    warrantyDays: optionalNumberField('Informe uma garantia válida'),
    active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.billingType === 'LABOR_ONLY') {
      if (values.productPrice !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['productPrice'],
          message: 'Para cobrança apenas de mão de obra, o valor de produto deve ser 0.',
        });
      }

      if (values.materialSource === 'SHOP_SUPPLIES') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['materialSource'],
          message: 'Serviços apenas de mão de obra não podem usar material da oficina.',
        });
      }
    }

    if (values.materialSource === 'NO_PARTS_REQUIRED') {
      if (values.productPrice !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['productPrice'],
          message: 'Quando não há peças, o valor de produto deve ser 0.',
        });
      }

      if (values.billingType === 'PARTS_AND_LABOR') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['billingType'],
          message: 'Sem peças, não é permitido cobrar peças e mão de obra.',
        });
      }
    }

    if (values.warrantyDays !== undefined && values.warrantyDays < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['warrantyDays'],
        message: 'A garantia não pode ser negativa.',
      });
    }
  });

export type ServiceCatalogSchema = z.infer<typeof serviceCatalogSchema>;
