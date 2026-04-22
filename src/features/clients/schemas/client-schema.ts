import { z } from 'zod';

const optionalText = z.string().trim().optional().or(z.literal(''));
const documentPattern = /^[\d./-]*$/;
const digitsPattern = /^\d*$/;

export const clientSchema = z.object({
  name: z.string().min(3, 'Informe o nome do cliente'),
  phone: optionalText
    .refine((value) => !value || digitsPattern.test(value), 'Telefone deve conter apenas números')
    .refine((value) => !value || value.length >= 10, 'Informe um telefone válido'),
  document: optionalText
    .refine((value) => !value || documentPattern.test(value), 'CPF/CNPJ inválido')
    .refine((value) => {
      if (!value) return true;
      const digits = value.replace(/\D/g, '');
      return digits.length === 11 || digits.length === 14;
    }, 'Informe CPF/CNPJ válido'),
  email: z.string().email('Informe um e-mail válido').optional().or(z.literal('')),
  notes: optionalText,
});

export type ClientSchema = z.infer<typeof clientSchema>;
