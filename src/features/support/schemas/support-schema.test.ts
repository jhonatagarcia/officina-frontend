import { describe, expect, it } from 'vitest';
import { supportTicketSchema } from './support-schema';

describe('supportTicketSchema', () => {
  it('aceita bugs e melhorias sem avaliação', () => {
    for (const type of ['BUG', 'IMPROVEMENT'] as const) {
      expect(
        supportTicketSchema.safeParse({
          type,
          subject: 'Assunto válido',
          message: 'Descrição detalhada do chamado.',
        }).success,
      ).toBe(true);
    }
  });

  it('exige avaliação apenas para comentários', () => {
    expect(
      supportTicketSchema.safeParse({
        type: 'COMMENT',
        subject: 'Comentário válido',
        message: 'Descrição detalhada do comentário.',
      }).success,
    ).toBe(false);

    expect(
      supportTicketSchema.safeParse({
        type: 'COMMENT',
        subject: 'Comentário válido',
        message: 'Descrição detalhada do comentário.',
        rating: 5,
      }).success,
    ).toBe(true);
  });

  it('rejeita textos inválidos', () => {
    expect(
      supportTicketSchema.safeParse({
        type: 'BUG',
        subject: 'Ok',
        message: 'curto',
      }).success,
    ).toBe(false);
  });
});
