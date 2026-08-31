import { http } from '@/services/api/http';
import { toNumber } from '@/lib/utils';
import type {
  CommissionLedgerEntry,
  CommissionLedgerResponse,
  CommissionPolicy,
} from '@/features/commissions/types';

interface LedgerApiResponse extends Omit<
  CommissionLedgerResponse,
  'data' | 'balance'
> {
  data: Array<
    Omit<CommissionLedgerEntry, 'laborBaseAmount' | 'amount'> & {
      laborBaseAmount: number | string;
      amount: number | string;
    }
  >;
  balance: number | string;
}

function mapLedger(response: LedgerApiResponse): CommissionLedgerResponse {
  return {
    ...response,
    balance: toNumber(response.balance),
    data: response.data.map((entry) => ({
      ...entry,
      laborBaseAmount: toNumber(entry.laborBaseAmount),
      amount: toNumber(entry.amount),
    })),
  };
}

export const commissionsService = {
  async listOwn(): Promise<CommissionLedgerResponse> {
    const response = await http.get<LedgerApiResponse>('/commissions/me', {
      params: { page: 1, limit: 100 },
    });
    return mapLedger(response.data);
  },
  async listForEmployee(employeeId: string): Promise<CommissionLedgerResponse> {
    const response = await http.get<LedgerApiResponse>(
      `/commissions/employees/${employeeId}`,
      { params: { page: 1, limit: 100 } },
    );
    return mapLedger(response.data);
  },
  async getPolicy(employeeId: string): Promise<CommissionPolicy | null> {
    const response = await http.get<CommissionPolicy | null>(
      `/commissions/employees/${employeeId}/policy`,
    );
    return response.data;
  },
  async setPolicy(employeeId: string, ratePercent: number, reason?: string) {
    const response = await http.put<CommissionPolicy>(
      `/commissions/employees/${employeeId}/policy`,
      { ratePercent, ...(reason ? { reason } : {}) },
    );
    return response.data;
  },
};
