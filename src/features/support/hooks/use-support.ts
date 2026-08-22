import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportService } from '@/features/support/services/support-service';

export function useSupportTickets() {
  return useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: supportService.list,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportService.create,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] }),
  });
}

export function useReplyToSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      message,
    }: {
      ticketId: string;
      message: string;
    }) => supportService.reply(ticketId, message),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] }),
  });
}

export function usePublicTestimonials(page = 1, limit = 3) {
  return useQuery({
    queryKey: ['public', 'testimonials', page, limit],
    queryFn: () => supportService.listPublicTestimonials(page, limit),
    staleTime: 5 * 60_000,
  });
}
