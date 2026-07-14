import { http } from '@/services/api/http';
import type {
  PaginatedResponse,
  PublicTestimonial,
  SupportTicket,
  SupportTicketType,
} from '@/features/support/types';
import type { SupportTicketFormValues } from '@/features/support/schemas/support-schema';

export const supportService = {
  async list() {
    const response = await http.get<PaginatedResponse<SupportTicket>>(
      '/support',
      {
        params: { page: 1, limit: 100 },
      },
    );
    return response.data;
  },

  async create(payload: SupportTicketFormValues) {
    const response = await http.post<SupportTicket>('/support', payload);
    return response.data;
  },

  async reply(ticketId: string, message: string) {
    const response = await http.post<SupportTicket>(
      `/support/${ticketId}/messages`,
      { message },
    );
    return response.data;
  },

  async listPublicTestimonials(page: number, limit: number) {
    const response = await http.get<PaginatedResponse<PublicTestimonial>>(
      '/testimonials',
      {
        params: { page, limit },
      },
    );
    return response.data;
  },
};

export const supportTypeLabels: Record<SupportTicketType, string> = {
  BUG: 'Bug (erro)',
  IMPROVEMENT: 'Melhoria',
  COMMENT: 'Comentário',
};
