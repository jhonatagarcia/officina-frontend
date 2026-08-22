export type Role = 'ADMIN' | 'ATENDENTE' | 'MECANICO' | 'FINANCEIRO';
export type AdminRole = 'SUPER_ADMIN' | 'SUPPORT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  adminRole?: AdminRole;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  workshop?: WorkshopFiscalProfile | null;
  workshopFiscalStatus?: WorkshopFiscalStatus;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
  captchaToken?: string | undefined;
}

export interface GoogleLoginPayload {
  credential: string;
}

export interface RegisterWorkshopPayload {
  tradeName: string;
  cnpj?: string | null;
  email: string;
  password: string;
  confirmPassword: string;
  captchaToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
  captchaToken: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  passwordConfirmation: string;
  captchaToken?: string;
}

export type WorkshopFiscalStatus = 'COMPLETE' | 'INCOMPLETE' | 'UNKNOWN';

export interface WorkshopFiscalProfile {
  id?: string;
  name?: string | null;
  tradeName?: string | null;
  cnpj?: string | null;
  fiscalStatus?: WorkshopFiscalStatus;
  fiscalRegistrationComplete?: boolean;
}
