import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Bug, Lightbulb, MessageCircle, Send, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import {
  useCreateSupportTicket,
  useReplyToSupportTicket,
  useSupportTickets,
} from '@/features/support/hooks/use-support';
import {
  supportTicketSchema,
  type SupportTicketFormValues,
} from '@/features/support/schemas/support-schema';
import { supportTypeLabels } from '@/features/support/services/support-service';
import type {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketType,
} from '@/features/support/types';
import { cn } from '@/lib/utils';

const typeOptions: Array<{
  type: SupportTicketType;
  icon: typeof Bug;
  title: string;
  description: string;
}> = [
  {
    type: 'BUG',
    icon: Bug,
    title: 'Bug (erro)',
    description: 'Algo não funcionou como deveria.',
  },
  {
    type: 'IMPROVEMENT',
    icon: Lightbulb,
    title: 'Melhoria',
    description: 'Uma ideia para evoluir o sistema.',
  },
  {
    type: 'COMMENT',
    icon: MessageCircle,
    title: 'Comentário',
    description: 'Conte como está sua experiência.',
  },
];

const statusLabels: Record<SupportTicketStatus, string> = {
  OPEN: 'Aberto',
  PENDING: 'Aguardando você',
  RESOLVED: 'Resolvido',
};

export function SupportPage() {
  const ticketsQuery = useSupportTickets();
  const createTicket = useCreateSupportTicket();
  const replyToTicket = useReplyToSupportTicket();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: { type: 'BUG', subject: '', message: '' },
  });
  const selectedType = watch('type');
  const rating = watch('rating');
  const tickets = useMemo(
    () => ticketsQuery.data?.data ?? [],
    [ticketsQuery.data],
  );
  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0];

  useEffect(() => {
    if (!selectedTicketId && tickets[0]) setSelectedTicketId(tickets[0].id);
  }, [selectedTicketId, tickets]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createTicket.mutateAsync(values);
      reset({ type: 'BUG', subject: '', message: '' });
      setSelectedTicketId(created.id);
      toast.success('Chamado enviado ao suporte master.');
    } catch {
      toast.error('Não foi possível abrir o chamado agora.');
    }
  });

  async function sendReply() {
    const message = reply.trim();
    if (!selectedTicket || message.length < 2) return;

    try {
      await replyToTicket.mutateAsync({ ticketId: selectedTicket.id, message });
      setReply('');
      toast.success('Mensagem enviada.');
    } catch {
      toast.error('Não foi possível enviar a mensagem.');
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Chamados"
        description="Fale diretamente com o suporte master, acompanhe respostas e ajude a melhorar o AutoPro System."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Abrir novo chamado</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label>Como podemos ajudar?</Label>
                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  {typeOptions.map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => {
                        setValue('type', option.type, {
                          shouldValidate: true,
                        });
                        if (option.type !== 'COMMENT') {
                          setValue('rating', undefined, {
                            shouldValidate: true,
                          });
                        }
                      }}
                      className={cn(
                        'rounded-2xl border p-3 text-left transition-colors',
                        selectedType === option.type
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-background hover:border-primary/40',
                      )}
                    >
                      <option.icon className="mb-2 size-5 text-primary" />
                      <span className="block text-sm font-semibold">
                        {option.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-subject">Assunto</Label>
                <Input
                  id="support-subject"
                  placeholder="Resuma o que você precisa"
                  maxLength={120}
                  invalid={Boolean(errors.subject)}
                  {...register('subject')}
                />
                {errors.subject ? (
                  <p className="text-sm text-destructive">
                    {errors.subject.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-message">Mensagem</Label>
                <Textarea
                  id="support-message"
                  placeholder="Descreva os detalhes para que possamos ajudar."
                  maxLength={2000}
                  aria-invalid={Boolean(errors.message)}
                  {...register('message')}
                />
                {errors.message ? (
                  <p className="text-sm text-destructive">
                    {errors.message.message}
                  </p>
                ) : null}
              </div>

              {selectedType === 'COMMENT' ? (
                <div className="space-y-2">
                  <Label>Sua avaliação do AutoPro System</Label>
                  <StarRating
                    value={rating ?? 0}
                    onChange={(value) =>
                      setValue('rating', value, { shouldValidate: true })
                    }
                  />
                  {errors.rating ? (
                    <p className="text-sm text-destructive">
                      {errors.rating.message}
                    </p>
                  ) : null}
                  <p className="text-xs leading-5 text-muted-foreground">
                    Comentários com 5 estrelas poderão aparecer na página
                    pública de depoimentos com seu nome e o nome do negócio.
                  </p>
                </div>
              ) : null}

              <Button
                className="w-full rounded-xl"
                type="submit"
                disabled={createTicket.isPending}
              >
                <Send className="size-4" />
                {createTicket.isPending ? 'Enviando...' : 'Enviar chamado'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Seus chamados</h2>
            <p className="text-sm text-muted-foreground">
              Selecione um chamado para acompanhar a conversa.
            </p>
          </div>

          {ticketsQuery.isLoading ? <LoadingState /> : null}
          {!ticketsQuery.isLoading && tickets.length === 0 ? (
            <EmptyState
              title="Nenhum chamado aberto"
              description="Seu primeiro chamado aparecerá aqui."
            />
          ) : null}

          {tickets.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      'w-full rounded-2xl border p-3 text-left transition-colors',
                      selectedTicket?.id === ticket.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/40',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-primary">
                        {supportTypeLabels[ticket.type]}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold">
                      {ticket.subject}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(ticket.updatedAt)}
                    </p>
                  </button>
                ))}
              </div>
              {selectedTicket ? (
                <Conversation
                  ticket={selectedTicket}
                  reply={reply}
                  onReplyChange={setReply}
                  onSendReply={sendReply}
                  isSending={replyToTicket.isPending}
                />
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </PageContainer>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div
      className="flex gap-1"
      role="radiogroup"
      aria-label="Avaliação do sistema"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
          onClick={() => onChange(star)}
          className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={cn(
              'size-7',
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}

function Conversation({
  ticket,
  reply,
  onReplyChange,
  onSendReply,
  isSending,
}: {
  ticket: SupportTicket;
  reply: string;
  onReplyChange: (value: string) => void;
  onSendReply: () => void;
  isSending: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {supportTypeLabels[ticket.type]}
            </p>
            <CardTitle className="mt-2">{ticket.subject}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {ticket.rating ? (
              <span
                className="text-amber-500"
                aria-label={`${ticket.rating} de 5 estrelas`}
              >
                {'★'.repeat(ticket.rating)}
              </span>
            ) : null}
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {ticket.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'max-w-[88%] rounded-2xl px-4 py-3',
                message.authorType === 'MASTER'
                  ? 'mr-auto bg-secondary'
                  : 'ml-auto bg-primary text-primary-foreground',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs opacity-75">
                <strong>
                  {message.authorType === 'MASTER' ? 'Suporte master' : 'Você'}
                </strong>
                <span>{formatDate(message.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {message.body}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-border pt-4">
          <Textarea
            value={reply}
            onChange={(event) => onReplyChange(event.target.value)}
            placeholder="Escreva uma resposta..."
            maxLength={2000}
            className="min-h-20"
          />
          <Button
            type="button"
            size="icon"
            className="mt-auto shrink-0 rounded-xl"
            aria-label="Enviar resposta"
            disabled={reply.trim().length < 2 || isSending}
            onClick={onSendReply}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: SupportTicketStatus }) {
  const variant =
    status === 'OPEN' ? 'warning' : status === 'PENDING' ? 'info' : 'success';
  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
