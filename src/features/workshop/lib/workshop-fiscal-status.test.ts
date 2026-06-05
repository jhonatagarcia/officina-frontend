import { describe, expect, it } from 'vitest';
import { resolveWorkshopFiscalState } from '@/features/workshop/lib/workshop-fiscal-status';
import type { User } from '@/types/auth';

const baseUser: User = {
  id: 'user-1',
  name: 'Ana',
  email: 'ana@oficina.com',
  role: 'ADMIN',
};

describe('resolveWorkshopFiscalState', () => {
  it('trata ausencia temporaria do contrato fiscal como desconhecida', () => {
    expect(resolveWorkshopFiscalState(baseUser)).toEqual({
      status: 'unknown',
      hasContract: false,
      hasCnpj: null,
      cnpj: null,
    });
  });

  it('trata oficina sem CNPJ como cadastro fiscal incompleto', () => {
    expect(resolveWorkshopFiscalState({ ...baseUser, workshop: { cnpj: null } })).toMatchObject({
      status: 'incomplete',
      hasContract: true,
      hasCnpj: false,
    });
  });

  it('trata oficina com CNPJ como cadastro fiscal completo', () => {
    expect(resolveWorkshopFiscalState({ ...baseUser, workshop: { cnpj: '11222333000181' } })).toMatchObject({
      status: 'complete',
      hasContract: true,
      hasCnpj: true,
      cnpj: '11222333000181',
    });
  });

  it('respeita status fiscal explicito do backend quando presente', () => {
    expect(resolveWorkshopFiscalState({ ...baseUser, workshopFiscalStatus: 'INCOMPLETE' })).toMatchObject({
      status: 'incomplete',
      hasContract: true,
    });
  });
});
