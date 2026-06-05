import type { Mechanic } from '@/features/mechanics/types';
import type { ServiceOrderStatus } from '@/features/service-orders/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceOrderActionsCardProps {
  mechanicOptions: Mechanic[];
  mechanicsDisabled: boolean;
  mechanicSavePending: boolean;
  selectedMechanicId: string;
  onSelectedMechanicIdChange: (value: string) => void;
  onSaveMechanic: () => void;
  expectedDeliveryAt: string;
  expectedDeliveryAtError: string | null;
  minExpectedDeliveryAt: string;
  deliveryEstimatePending: boolean;
  onExpectedDeliveryAtChange: (value: string) => void;
  onSaveExpectedDeliveryAt: () => void;
  nextStatus: ServiceOrderStatus | '';
  currentStatus: ServiceOrderStatus;
  statusPending: boolean;
  onNextStatusChange: (value: ServiceOrderStatus) => void;
  onUpdateStatus: () => void;
  canGeneratePdf: boolean;
  isGeneratingPdf: boolean;
  onGeneratePdf: () => void;
}

export function ServiceOrderActionsCard({
  mechanicOptions,
  mechanicsDisabled,
  mechanicSavePending,
  selectedMechanicId,
  onSelectedMechanicIdChange,
  onSaveMechanic,
  expectedDeliveryAt,
  expectedDeliveryAtError,
  minExpectedDeliveryAt,
  deliveryEstimatePending,
  onExpectedDeliveryAtChange,
  onSaveExpectedDeliveryAt,
  nextStatus,
  currentStatus,
  statusPending,
  onNextStatusChange,
  onUpdateStatus,
  canGeneratePdf,
  isGeneratingPdf,
  onGeneratePdf,
}: ServiceOrderActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações da OS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mecânico responsável</Label>
          <Select disabled={mechanicsDisabled} onValueChange={onSelectedMechanicIdChange} value={selectedMechanicId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um mecânico" />
            </SelectTrigger>
            <SelectContent>
              {mechanicOptions.map((mechanic) => (
                <SelectItem key={mechanic.id} value={mechanic.id}>
                  {mechanic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full" disabled={mechanicsDisabled} variant="outline" onClick={onSaveMechanic}>
            {mechanicSavePending ? 'Salvando mecânico...' : 'Salvar mecânico'}
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="expectedDeliveryAt">Previsão de entrega</Label>
          <Input
            id="expectedDeliveryAt"
            type="date"
            min={minExpectedDeliveryAt}
            value={expectedDeliveryAt}
            onChange={(event) => onExpectedDeliveryAtChange(event.target.value)}
          />
          {expectedDeliveryAtError ? <p className="text-xs text-destructive">{expectedDeliveryAtError}</p> : null}
          <Button
            className="w-full"
            disabled={deliveryEstimatePending}
            variant="outline"
            onClick={onSaveExpectedDeliveryAt}
          >
            {deliveryEstimatePending ? 'Salvando previsão...' : 'Salvar previsão'}
          </Button>
        </div>
        <Select onValueChange={(value) => onNextStatusChange(value as ServiceOrderStatus)} value={nextStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o novo status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ABERTA">Aberta</SelectItem>
            <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
            <SelectItem value="FINALIZADA">Finalizada</SelectItem>
            <SelectItem value="ENTREGUE">Entregue</SelectItem>
          </SelectContent>
        </Select>
        <Button disabled={statusPending || !nextStatus || nextStatus === currentStatus} className="w-full" onClick={onUpdateStatus}>
          {statusPending ? 'Salvando status...' : 'Salvar status'}
        </Button>
        <Button className="w-full" disabled={!canGeneratePdf || isGeneratingPdf} variant="outline" onClick={onGeneratePdf}>
          {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}
        </Button>
      </CardContent>
    </Card>
  );
}
