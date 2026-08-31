import { z } from 'zod';

export const supportTicketSchema = z
  .object({
    type: z.enum(['BUG', 'IMPROVEMENT', 'COMMENT']),
    subject: z
      .string()
      .trim()
      .min(3, 'Informe um assunto com pelo menos 3 caracteres.')
      .max(120, 'Use no máximo 120 caracteres.'),
    message: z
      .string()
      .trim()
      .min(10, 'Descreva o chamado com pelo menos 10 caracteres.')
      .max(2000, 'Use no máximo 2.000 caracteres.'),
    rating: z.number().int().min(1).max(5).optional(),
  })
  .superRefine((values, context) => {
    if (values.type === 'COMMENT' && values.rating === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rating'],
        message: 'Escolha uma avaliação.',
      });
    }
  });

export type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;
