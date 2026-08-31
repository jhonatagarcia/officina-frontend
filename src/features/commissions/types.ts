export type CommissionLedgerEntryType =
  | 'COMMISSION_EARNED'
  | 'COMMISSION_REVERSAL'
  | 'COMMISSION_ADJUSTMENT_CREDIT'
  | 'COMMISSION_ADJUSTMENT_DEBIT'
  | 'COMMISSION_NO_IMPACT';

export interface CommissionPolicy {
  id: string;
  employeeId: string;
  rateBps: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  reason: string | null;
}

export interface CommissionLedgerEntry {
  id: string;
  employeeId: string;
  serviceOrderId: string | null;
  financialEntryId: string | null;
  entryType: CommissionLedgerEntryType;
  laborBaseAmount: number;
  commissionRateBps: number;
  amount: number;
  currency: string;
  reason: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface CommissionLedgerResponse {
  data: CommissionLedgerEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  balance: number;
}
