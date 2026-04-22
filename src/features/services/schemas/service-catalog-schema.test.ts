import { describe, expect, it } from 'vitest';
import { serviceCatalogSchema } from '@/features/services/schemas/service-catalog-schema';

describe('serviceCatalogSchema', () => {
  it('trava productPrice quando a cobrança é apenas mão de obra', () => {
    const result = serviceCatalogSchema.safeParse({
      name: 'Alinhamento',
      category: 'suspensao',
      description: '',
      internalNotes: '',
      laborPrice: 100,
      productPrice: 25,
      billingType: 'LABOR_ONLY',
      materialSource: 'CUSTOMER_SUPPLIES',
      warrantyDays: 30,
      active: true,
    });

    expect(result.success).toBe(false);
  });

  it('aceita serviço sem peças quando productPrice é zero', () => {
    const result = serviceCatalogSchema.safeParse({
      name: 'Mão de obra avulsa',
      category: 'geral',
      description: '',
      internalNotes: '',
      laborPrice: 120,
      productPrice: 0,
      billingType: 'LABOR_ONLY',
      materialSource: 'FLEXIBLE',
      warrantyDays: 0,
      active: true,
    });

    expect(result.success).toBe(true);
  });
});
