import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin-api';

export type TicketStatus = 'OPEN' | 'PENDING' | 'RESOLVED';
export type TicketType = 'BUG' | 'IMPROVEMENT' | 'COMMENT';

export interface SupportMessage {
  id: string;
  authorType: 'USER' | 'MASTER';
  authorName: string;
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  type: TicketType;
  subject: string;
  message: string;
  rating: number | null;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
  workshop: {
    id: string;
    tradeName: string;
    ownerName?: string | null;
    email?: string | null;
  };
}

export interface SupportSummary {
  open: number;
  pending: number;
  resolved: number;
  active: number;
}

export function useSupportTickets(status?: string) {
  return useQuery({
    queryKey: ['admin', 'support', status],
    queryFn: () =>
      adminApi
        .get<
          SupportTicket[]
        >('/support', { params: status ? { status } : undefined })
        .then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useSupportSummary() {
  return useQuery({
    queryKey: ['admin', 'support', 'summary'],
    queryFn: () =>
      adminApi.get<SupportSummary>('/support/summary').then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      adminApi
        .patch<SupportTicket>(`/support/${id}/status`, { status })
        .then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'support'] }),
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      adminApi
        .post<SupportTicket>(`/support/${id}/messages`, { message })
        .then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'support'] }),
  });
}
