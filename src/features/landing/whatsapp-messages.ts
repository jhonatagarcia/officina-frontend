export type WhatsAppServiceOrderStatus =
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_PECA'
  | 'FINALIZADA'
  | 'ENTREGUE';

export interface WhatsAppLandingMessage {
  status: WhatsAppServiceOrderStatus;
  label: string;
  time: string;
  text: string;
}

const SAMPLE_CLIENT_NAME = 'Jamille Bentica';

// Espelha o backend em oficina-backend/src/notifications/services/service-order-whatsapp-message.service.ts.
export function buildServiceOrderWhatsAppMessage(
  status: WhatsAppServiceOrderStatus,
  clientName = SAMPLE_CLIENT_NAME,
): string {
  if (status === 'EM_ANDAMENTO') {
    return `Olá ${clientName} o serviço do seu carro esta em andamento`;
  }

  if (status === 'AGUARDANDO_PECA') {
    return `Olá ${clientName} compramos a peça necessária para o serviço solicitado`;
  }

  if (status === 'FINALIZADA') {
    return `Olá ${clientName} o serviço do seu carro esta finalizado, pode vir retirar`;
  }

  return `Olá ${clientName}, obrigado pela confiança em nossos serviços. Volte sempre.`;
}

export const landingWhatsAppMessages: WhatsAppLandingMessage[] = [
  {
    status: 'EM_ANDAMENTO',
    label: 'Serviço iniciado',
    time: '09:15',
    text: buildServiceOrderWhatsAppMessage('EM_ANDAMENTO'),
  },
  {
    status: 'AGUARDANDO_PECA',
    label: 'Peça comprada',
    time: '10:42',
    text: buildServiceOrderWhatsAppMessage('AGUARDANDO_PECA'),
  },
  {
    status: 'FINALIZADA',
    label: 'Serviço finalizado',
    time: '14:32',
    text: buildServiceOrderWhatsAppMessage('FINALIZADA'),
  },
  {
    status: 'ENTREGUE',
    label: 'Veículo entregue',
    time: '17:08',
    text: buildServiceOrderWhatsAppMessage('ENTREGUE'),
  },
];
