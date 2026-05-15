import type { User, WorkshopFiscalStatus } from '@/types/auth';

export interface WorkshopFiscalState {
  status: Lowercase<WorkshopFiscalStatus>;
  hasContract: boolean;
  hasCnpj: boolean | null;
  cnpj: string | null;
}

function normalizeCnpj(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function resolveWorkshopFiscalState(user?: Partial<User> | null): WorkshopFiscalState {
  const workshop = user?.workshop;
  const directFiscalStatus = user?.workshopFiscalStatus;
  const hasFiscalStatus = directFiscalStatus === 'COMPLETE' || directFiscalStatus === 'INCOMPLETE';
  const hasWorkshopContract = workshop !== undefined && workshop !== null;
  const hasRegistrationFlag = typeof workshop?.fiscalRegistrationComplete === 'boolean';
  const workshopFiscalStatus = workshop?.fiscalStatus;
  const hasWorkshopFiscalStatus = workshopFiscalStatus === 'COMPLETE' || workshopFiscalStatus === 'INCOMPLETE';
  const cnpj = normalizeCnpj(workshop?.cnpj);

  if (!hasWorkshopContract && !hasFiscalStatus) {
    return {
      status: 'unknown',
      hasContract: false,
      hasCnpj: null,
      cnpj: null,
    };
  }

  if (hasFiscalStatus) {
    return {
      status: directFiscalStatus.toLowerCase() as Lowercase<WorkshopFiscalStatus>,
      hasContract: true,
      hasCnpj: directFiscalStatus === 'COMPLETE',
      cnpj,
    };
  }

  if (hasWorkshopFiscalStatus) {
    return {
      status: workshopFiscalStatus.toLowerCase() as Lowercase<WorkshopFiscalStatus>,
      hasContract: true,
      hasCnpj: workshopFiscalStatus === 'COMPLETE',
      cnpj,
    };
  }

  if (hasRegistrationFlag) {
    const fiscalRegistrationComplete = workshop.fiscalRegistrationComplete === true;

    return {
      status: fiscalRegistrationComplete ? 'complete' : 'incomplete',
      hasContract: true,
      hasCnpj: fiscalRegistrationComplete,
      cnpj,
    };
  }

  return {
    status: cnpj ? 'complete' : 'incomplete',
    hasContract: true,
    hasCnpj: Boolean(cnpj),
    cnpj,
  };
}
