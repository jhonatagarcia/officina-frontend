import { z } from 'zod';

const strongPasswordSchema = z
  .string()
  .min(8, 'A senha precisa ter ao menos 8 caracteres')
  .regex(/[A-Z]/, 'Use ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Use ao menos uma letra minúscula')
  .regex(/\d/, 'Use ao menos um número');

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function isValidCnpj(value: string) {
  const cnpj = onlyDigits(value);
  if (!cnpj) return true;
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const digits = cnpj.split('').map(Number);
  const calculateDigit = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((total, weight, index) => total + (digits[index] ?? 0) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(12) === digits[12] && calculateDigit(13) === digits[13];
}

export const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres'),
  captchaToken: z.string().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    tradeName: z.string().trim().min(2, 'Informe o nome fantasia do negócio'),
    cnpj: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || isValidCnpj(value), 'Informe um CNPJ válido ou deixe em branco'),
    email: z.string().email('Informe um e-mail válido'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirme a senha'),
    captchaToken: z.string().min(1, 'Confirme o captcha para continuar'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas precisam ser iguais',
    path: ['confirmPassword'],
  });

export type RegisterSchema = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  captchaToken: z.string().min(1, 'Confirme o captcha para continuar'),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
    captchaToken: z.string().min(1, 'Confirme o captcha para continuar'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas precisam ser iguais',
    path: ['confirmPassword'],
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
