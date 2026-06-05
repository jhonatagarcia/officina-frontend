import { http } from '@/services/api/http';

export interface UpdateWorkshopProfilePayload {
  tradeName: string;
  cnpj?: string | null;
}

export interface WorkshopProfile {
  id: string;
  tradeName: string;
  cnpj: string | null;
  isActive: boolean;
  fiscalProfile: {
    status: 'COMPLETE' | 'INCOMPLETE';
    hasCnpj: boolean;
    canUseFiscalFeatures: boolean;
    blockingReason: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const workshopService = {
  async getProfile() {
    const response = await http.get<WorkshopProfile>('/workshop/profile');
    return response.data;
  },
  async updateProfile(payload: UpdateWorkshopProfilePayload) {
    const response = await http.put<WorkshopProfile>('/workshop/profile', payload);
    return response.data;
  },
};
