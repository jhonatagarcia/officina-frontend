import type { Role } from '@/types/auth';

export interface Mechanic {
  id: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
