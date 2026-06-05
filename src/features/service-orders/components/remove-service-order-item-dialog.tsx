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
import type { ServiceOrderBudgetItem } from '@/features/service-orders/types';
import { formatCurrency } from '@/lib/utils';

interface RemoveServiceOrderItemDialogProps {
  item: ServiceOrderBudgetItem | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RemoveServiceOrderItemDialog({
  item,
  isSubmitting,
  onCancel,
  onConfirm,
}: RemoveServiceOrderItemDialogProps) {
  return (
    <AlertDialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onCancel();
      }}
    >
      <AlertDialogContent className="rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir item da execução?</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            O item deixará de compor os serviços e peças desta OS. O orçamento aprovado e o estoque
            não serão alterados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {item ? (
          <div className="rounded-md border border-border-soft bg-stone-50 p-4 text-sm">
            <p className="font-bold">{item.description}</p>
            <p className="mt-1 text-muted-foreground">
              Quantidade: {item.quantity} - Total: {formatCurrency(item.totalPrice)}
            </p>
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-rose-600 hover:bg-rose-700"
            disabled={isSubmitting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isSubmitting ? 'Excluindo...' : 'Excluir item'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
