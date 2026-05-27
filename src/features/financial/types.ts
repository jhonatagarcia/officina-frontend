export type FinancialType = 'RECEIVABLE' | 'PAYABLE';
export type FinancialStatus = 'PENDENTE' | 'PAGO' | 'VENCIDO';
export type PaymentMethod =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'OUTRO';

export type FiscalEmissionStatus =
  | 'PENDENTE'
  | 'PROCESSANDO'
  | 'AUTORIZADA'
  | 'REJEITADA'
  | 'CANCELADA'
  | 'ERRO_PERMANENTE';

export interface FinancialEntryFiscalEmission {
  id: string;
  financialEntryId: string;
  serviceOrderId: string;
  status: FiscalEmissionStatus;
  serviceAmount: string;
  invoiceNumber: string | null;
  danfseAvailable: boolean;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialEntry {
  id: string;
  type: FinancialType;
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  status: FinancialStatus;
  clientId: string | null;
  serviceOrderId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    document: string | null;
  } | null;
  serviceOrder: {
    id: string;
    orderNumber: string;
    status: string;
  } | null;
  fiscalEmission: FinancialEntryFiscalEmission | null;
}
