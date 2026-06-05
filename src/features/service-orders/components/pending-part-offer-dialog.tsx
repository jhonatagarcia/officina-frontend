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

interface PendingPartOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPendingPart: () => void;
}

export function PendingPartOfferDialog({
  open,
  onOpenChange,
  onAddPendingPart,
}: PendingPartOfferDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Adicionar peça pendente?</AlertDialogTitle>
          <AlertDialogDescription>
            Você pode informar qual peça está segurando esta OS agora, ou fazer isso depois no detalhe da ordem.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Informar depois</AlertDialogCancel>
          <AlertDialogAction onClick={onAddPendingPart}>Adicionar peça</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
