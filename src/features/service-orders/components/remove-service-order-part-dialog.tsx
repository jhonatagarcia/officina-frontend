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
import type { ServiceOrderPart } from '@/features/service-orders/types';

interface RemoveServiceOrderPartDialogProps {
  part: ServiceOrderPart | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RemoveServiceOrderPartDialog({
  part,
  isSubmitting,
  onCancel,
  onConfirm,
}: RemoveServiceOrderPartDialogProps) {
  return (
    <AlertDialog
      open={Boolean(part)}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onCancel();
      }}
    >
      <AlertDialogContent className="rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Remover peça da OS?</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            A peça será removida da ordem de serviço e a quantidade aplicada será devolvida ao estoque.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {part ? (
          <div className="rounded-md border border-border-soft bg-stone-50 p-4 text-sm">
            <p className="font-bold">{part.inventoryItem.name}</p>
            <p className="mt-1 text-muted-foreground">
              {part.inventoryItem.internalCode} - Quantidade: {part.quantity}
            </p>
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isSubmitting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isSubmitting ? 'Removendo...' : 'Remover peça'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
