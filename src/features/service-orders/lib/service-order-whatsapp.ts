import { formatDateOnly } from '@/lib/utils';
import type { ServiceOrderStatus } from '@/features/service-orders/types';

export interface ServiceOrderWhatsAppMessage {
  clientName: string;
  message: string;
  url: string;
}

function normalizeWhatsAppPhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, '') ?? '';

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function buildServiceOrderWhatsAppMessage({
  status,
  clientName,
  clientPhone,
  expectedDeliveryAt,
}: {
  status: ServiceOrderStatus;
  clientName: string;
  clientPhone: string | null | undefined;
  expectedDeliveryAt: string | null | undefined;
}): ServiceOrderWhatsAppMessage | null {
  const phone = normalizeWhatsAppPhone(clientPhone);
  if (!phone) return null;

  const messages: Partial<Record<ServiceOrderStatus, string>> = {
    EM_ANDAMENTO: `Caro cliente ${clientName}, o seu veículo está no estágio de manutenção.${
      expectedDeliveryAt
        ? ` A previsão de entrega do veículo é ${formatDateOnly(expectedDeliveryAt)}.`
        : ''
    }`,
    AGUARDANDO_PECA: `Caro cliente ${clientName}, as peças para a manutenção do seu veículo foram compradas, estamos aguardando a chegada para dar início à manutenção.`,
    FINALIZADA: `Caro cliente ${clientName}, o seu veículo já está pronto para retirada.`,
    ENTREGUE: `Caro cliente ${clientName}, obrigado pela confiança em nossos serviços.`,
  };
  const message = messages[status];

  if (!message) return null;

  return {
    clientName,
    message,
    url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
  };
}
