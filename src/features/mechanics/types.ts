export interface Mechanic {
  id: string;
  name: string;
  function: 'MECHANIC';
  isActive: boolean;
  hasAccess: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}
