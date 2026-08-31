import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ServiceOrderWhatsAppMessage } from '@/features/service-orders/lib/service-order-whatsapp';

interface ServiceOrderWhatsAppDialogProps {
  notification: ServiceOrderWhatsAppMessage | null;
  onClose: () => void;
}

export function ServiceOrderWhatsAppDialog({
  notification,
  onClose,
}: ServiceOrderWhatsAppDialogProps) {
  return (
    <AlertDialog
      open={Boolean(notification)}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Avisar cliente pelo WhatsApp?</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            A OS já foi atualizada. Ao continuar, o WhatsApp Web será aberto com
            uma mensagem pronta para {notification?.clientName ?? 'o cliente'}.
            O envio permanece sob seu controle.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {notification ? (
          <p className="rounded-xl border border-border-soft bg-muted/40 p-4 text-sm leading-6 text-foreground">
            {notification.message}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Agora não</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              window.open(notification?.url, '_blank', 'noopener,noreferrer');
              onClose();
            }}
          >
            Abrir WhatsApp Web
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
