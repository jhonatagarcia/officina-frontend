import type { TicketStatus } from '../support/useSupport';
import type { TenantPlan, TenantStatus } from '../tenants/useTenants';
import type { AdminLog } from '../logs/useLogs';

export function planLabel(plan: TenantPlan | string): string {
  const labels: Record<string, string> = {
    TRIAL: 'Teste gratuito',
    BASIC: 'Basico',
    PRO: 'Profissional',
    ENTERPRISE: 'Empresarial',
  };

  return labels[plan] ?? plan;
}

export function tenantStatusLabel(status: TenantStatus | string): string {
  const labels: Record<string, string> = {
    TRIAL: 'Em teste',
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
  };

  return labels[status] ?? status;
}

export function ticketStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    OPEN: 'Aberto',
    PENDING: 'Pendente',
    RESOLVED: 'Resolvido',
  };

  return labels[status];
}

export function logLevelLabel(level: AdminLog['level']): string {
  const labels: Record<AdminLog['level'], string> = {
    ERROR: 'Erro',
    WARN: 'Alerta',
    INFO: 'Informacao',
  };

  return labels[level];
}

export function logCategoryLabel(category: AdminLog['category']): string {
  const labels: Record<AdminLog['category'], string> = {
    ADMIN: 'Admin',
    AUTH: 'Autenticacao',
    HTTP: 'API',
    SECURITY: 'Seguranca',
    QUEUE: 'Fila',
    // TODO(WhatsApp Cloud API): WHATSAPP: 'WhatsApp',
    REDIS: 'Redis',
  };

  return labels[category] ?? category;
}
