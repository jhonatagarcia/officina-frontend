import { useProfile } from '@/features/auth/hooks/use-profile';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import { resolveWorkshopFiscalState } from '@/features/workshop/lib/workshop-fiscal-status';
import { useWorkshopProfile } from '@/features/workshop/hooks/use-workshop-profile';

export const WORKSHOP_PROFILE_PATH = '/app/oficina';

export function useWorkshopFiscalStatus() {
  const { user: sessionUser } = useAuthState();
  const profileQuery = useProfile();
  const workshopQuery = useWorkshopProfile();
  const workshopProfile = workshopQuery.data;
  const baseUser = profileQuery.data ?? sessionUser ?? undefined;
  const user = workshopProfile
    ? {
        ...baseUser,
        workshop: {
          id: workshopProfile.id,
          tradeName: workshopProfile.tradeName,
          cnpj: workshopProfile.cnpj,
          fiscalStatus: workshopProfile.fiscalProfile.status,
          fiscalRegistrationComplete: workshopProfile.fiscalProfile.canUseFiscalFeatures,
        },
      }
    : (profileQuery.data ?? sessionUser);
  const fiscalState = resolveWorkshopFiscalState(user);

  return {
    ...fiscalState,
    isLoading: (profileQuery.isLoading && !profileQuery.data) || (workshopQuery.isLoading && !workshopQuery.data),
    isIncomplete: fiscalState.status === 'incomplete',
    isComplete: fiscalState.status === 'complete',
    isUnknown: fiscalState.status === 'unknown',
    ctaPath: WORKSHOP_PROFILE_PATH,
  };
}
