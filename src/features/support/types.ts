export type SupportTicketType = 'BUG' | 'IMPROVEMENT' | 'COMMENT';
export type SupportTicketStatus = 'OPEN' | 'PENDING' | 'RESOLVED';
export type SupportMessageAuthorType = 'USER' | 'MASTER';

export interface SupportMessage {
  id: string;
  authorType: SupportMessageAuthorType;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  type: SupportTicketType;
  subject: string;
  message: string;
  rating: number | null;
  status: SupportTicketStatus;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  workshop: {
    id: string;
    tradeName: string;
    ownerName: string | null;
    email: string | null;
  };
  messages: SupportMessage[];
}

export interface PublicTestimonial {
  id: string;
  quote: string;
  initials: string;
  name: string;
  role: string;
  rating: 5;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
