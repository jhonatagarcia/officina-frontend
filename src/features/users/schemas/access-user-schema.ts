import { z } from 'zod';

export const accessUserRoles = [
  'ADMIN',
  'ATENDENTE',
  'MECANICO',
  'FINANCEIRO',
] as const;

export const accessUserSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome da conta.'),
    email: z.string().trim().email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
    role: z.enum(accessUserRoles),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  });

export type AccessUserSchema = z.infer<typeof accessUserSchema>;
