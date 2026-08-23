import { describe, expect, it } from 'vitest';
import { buildServiceOrderWhatsAppMessage } from '@/features/service-orders/lib/service-order-whatsapp';

describe('service-order-whatsapp', () => {
  it('prepara a mensagem de manutenção com a previsão quando ela existir', () => {
    const notification = buildServiceOrderWhatsAppMessage({
      status: 'EM_ANDAMENTO',
      clientName: 'Cliente sintético',
      clientPhone: '(11) 99999-9999',
      expectedDeliveryAt: '2026-08-25T12:00:00.000Z',
    });

    expect(notification?.message).toContain('estágio de manutenção');
    expect(notification?.message).toContain('25/08/2026');
    expect(notification?.url).toContain('wa.me/5511999999999');
  });

  it('prepara as mensagens aprovadas para peça, conclusão e entrega', () => {
    for (const status of [
      'AGUARDANDO_PECA',
      'FINALIZADA',
      'ENTREGUE',
    ] as const) {
      expect(
        buildServiceOrderWhatsAppMessage({
          status,
          clientName: 'Cliente sintético',
          clientPhone: '5511999999999',
          expectedDeliveryAt: null,
        })?.message,
      ).toContain('Cliente sintético');
    }
  });

  it('não oferece WhatsApp para status sem mensagem ou telefone ausente', () => {
    expect(
      buildServiceOrderWhatsAppMessage({
        status: 'ABERTA',
        clientName: 'Cliente sintético',
        clientPhone: '11999999999',
        expectedDeliveryAt: null,
      }),
    ).toBeNull();
    expect(
      buildServiceOrderWhatsAppMessage({
        status: 'FINALIZADA',
        clientName: 'Cliente sintético',
        clientPhone: null,
        expectedDeliveryAt: null,
      }),
    ).toBeNull();
  });
});
