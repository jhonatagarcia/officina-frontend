import type { Role } from '@/types/auth';

export interface AccessUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccessUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  isActive: true;
}
