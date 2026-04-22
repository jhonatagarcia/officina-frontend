import { clientSchema } from '@/features/clients/schemas/client-schema';

describe('clientSchema', () => {
  it('rejeita payload inválido', () => {
    const result = clientSchema.safeParse({
      name: 'Jo',
      phone: '123',
      document: '1',
      email: 'email-invalido',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita telefone com letras', () => {
    const result = clientSchema.safeParse({
      name: 'João Santos',
      phone: '11abc988887777',
      document: '123.456.789-01',
      email: 'joao@oficina.com',
    });

    expect(result.success).toBe(false);
  });

  it('aceita payload válido', () => {
    const result = clientSchema.safeParse({
      name: 'João Santos',
      phone: '11988887777',
      document: '123.456.789-01',
      email: 'joao@oficina.com',
      notes: 'Cliente preferencial',
    });

    expect(result.success).toBe(true);
  });

  it('aceita CNPJ mascarado válido', () => {
    const result = clientSchema.safeParse({
      name: 'Oficina Exemplo',
      phone: '1133334444',
      document: '12.345.678/0001-90',
      email: 'contato@oficina.com',
    });

    expect(result.success).toBe(true);
  });
});
