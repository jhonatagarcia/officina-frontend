export type Role = 'ADMIN' | 'ATENDENTE' | 'MECANICO' | 'FINANCEIRO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}
