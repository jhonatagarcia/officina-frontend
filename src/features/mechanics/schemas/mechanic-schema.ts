import { z } from 'zod';

export function createMechanicSchema(mode: 'create' | 'edit' | 'view') {
  void mode;

  return z.object({
    name: z.string().min(3, 'Informe o nome'),
    isActive: z.boolean(),
    userId: z.string().nullable(),
  });
}

export type MechanicSchema = z.infer<ReturnType<typeof createMechanicSchema>>;
