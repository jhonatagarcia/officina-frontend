import { lazy } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BadgeDollarSign,
  Boxes,
  Building2,
  CarFront,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  UserRoundCog,
  UsersRound,
  Wrench,
} from 'lucide-react';
import type { Role } from '@/types/auth';

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/dashboard-page').then(({ DashboardPage }) => ({ default: DashboardPage })),
);
const ClientsPage = lazy(() =>
  import('@/features/clients/pages/clients-page').then(({ ClientsPage }) => ({ default: ClientsPage })),
);
const ClientFormPage = lazy(() =>
  import('@/features/clients/pages/client-form-page').then(({ ClientFormPage }) => ({ default: ClientFormPage })),
);
const VehiclesPage = lazy(() =>
  import('@/features/vehicles/pages/vehicles-page').then(({ VehiclesPage }) => ({ default: VehiclesPage })),
);
const VehicleFormPage = lazy(() =>
  import('@/features/vehicles/pages/vehicle-form-page').then(({ VehicleFormPage }) => ({ default: VehicleFormPage })),
);
const VehicleHistoryPage = lazy(() =>
  import('@/features/vehicle-history/pages/vehicle-history-page').then(({ VehicleHistoryPage }) => ({
    default: VehicleHistoryPage,
  })),
);
const BudgetsPage = lazy(() =>
  import('@/features/budgets/pages/budgets-page').then(({ BudgetsPage }) => ({ default: BudgetsPage })),
);
const BudgetFormPage = lazy(() =>
  import('@/features/budgets/pages/budget-form-page').then(({ BudgetFormPage }) => ({ default: BudgetFormPage })),
);
const ServiceOrdersPage = lazy(() =>
  import('@/features/service-orders/pages/service-orders-page').then(({ ServiceOrdersPage }) => ({
    default: ServiceOrdersPage,
  })),
);
const ServiceOrderDetailsPage = lazy(() =>
  import('@/features/service-orders/pages/service-order-details-page').then(({ ServiceOrderDetailsPage }) => ({
    default: ServiceOrderDetailsPage,
  })),
);
const InventoryPage = lazy(() =>
  import('@/features/inventory/pages/inventory-page').then(({ InventoryPage }) => ({ default: InventoryPage })),
);
const InventoryFormPage = lazy(() =>
  import('@/features/inventory/pages/inventory-form-page').then(({ InventoryFormPage }) => ({
    default: InventoryFormPage,
  })),
);
const FinancialPage = lazy(() =>
  import('@/features/financial/pages/financial-page').then(({ FinancialPage }) => ({ default: FinancialPage })),
);
const WorkshopProfilePage = lazy(() =>
  import('@/features/workshop/pages/workshop-profile-page').then(({ WorkshopProfilePage }) => ({ default: WorkshopProfilePage })),
);
const ServicesPage = lazy(() =>
  import('@/features/services/pages/services-page').then(({ ServicesPage }) => ({ default: ServicesPage })),
);
const ServiceFormPage = lazy(() =>
  import('@/features/services/pages/service-form-page').then(({ ServiceFormPage }) => ({ default: ServiceFormPage })),
);
const MechanicsPage = lazy(() =>
  import('@/features/mechanics/pages/mechanics-page').then(({ MechanicsPage }) => ({ default: MechanicsPage })),
);
const MechanicFormPage = lazy(() =>
  import('@/features/mechanics/pages/mechanic-form-page').then(({ MechanicFormPage }) => ({
    default: MechanicFormPage,
  })),
);

export interface AppRouteDefinition {
  key: string;
  path: string;
  roles: Role[];
  element: JSX.Element;
  label?: string;
  icon?: LucideIcon | undefined;
  sidebar?: boolean;
  requiresCnpj?: boolean;
}

export const appRoutes: AppRouteDefinition[] = [
  {
    key: 'dashboard',
    path: 'dashboard',
    roles: ['ADMIN', 'ATENDENTE', 'FINANCEIRO'],
    element: <DashboardPage />,
    label: 'Dashboard',
    icon: LayoutDashboard,
    sidebar: true,
  },
  {
    key: 'clientes-list',
    path: 'clientes',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <ClientsPage />,
    label: 'Clientes',
    icon: UsersRound,
    sidebar: true,
  },
  {
    key: 'clientes-create',
    path: 'clientes/novo',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <ClientFormPage mode="create" />,
  },
  {
    key: 'clientes-view',
    path: 'clientes/:id',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <ClientFormPage mode="view" />,
  },
  {
    key: 'clientes-edit',
    path: 'clientes/:id/editar',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <ClientFormPage mode="edit" />,
  },
  {
    key: 'veiculos-list',
    path: 'veiculos',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <VehiclesPage />,
    label: 'Veículos',
    icon: CarFront,
    sidebar: true,
  },
  {
    key: 'veiculos-create',
    path: 'veiculos/novo',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <VehicleFormPage mode="create" />,
  },
  {
    key: 'veiculos-view',
    path: 'veiculos/:id',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <VehicleFormPage mode="view" />,
  },
  {
    key: 'veiculos-edit',
    path: 'veiculos/:id/editar',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <VehicleFormPage mode="edit" />,
  },
  {
    key: 'veiculos-history',
    path: 'veiculos/:id/historico',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <VehicleHistoryPage />,
  },
  {
    key: 'orcamentos-list',
    path: 'orcamentos',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <BudgetsPage />,
    label: 'Orçamentos',
    icon: FileText,
    sidebar: true,
  },
  {
    key: 'orcamentos-create',
    path: 'orcamentos/novo',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <BudgetFormPage mode="create" />,
  },
  {
    key: 'orcamentos-view',
    path: 'orcamentos/:id',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <BudgetFormPage mode="view" />,
  },
  {
    key: 'orcamentos-edit',
    path: 'orcamentos/:id/editar',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <BudgetFormPage mode="edit" />,
  },
  {
    key: 'ordens-servico-list',
    path: 'ordens-servico',
    roles: ['ADMIN', 'ATENDENTE', 'MECANICO'],
    element: <ServiceOrdersPage />,
    label: 'Ordens de Serviço',
    icon: ClipboardCheck,
    sidebar: true,
  },
  {
    key: 'ordens-servico-view',
    path: 'ordens-servico/:id',
    roles: ['ADMIN', 'ATENDENTE', 'MECANICO'],
    element: <ServiceOrderDetailsPage />,
  },
  {
    key: 'estoque-list',
    path: 'estoque',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <InventoryPage />,
    label: 'Estoque',
    icon: Boxes,
    sidebar: true,
  },
  {
    key: 'estoque-create',
    path: 'estoque/novo',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <InventoryFormPage mode="create" />,
  },
  {
    key: 'estoque-edit',
    path: 'estoque/:id/editar',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <InventoryFormPage mode="edit" />,
  },
  {
    key: 'servicos-list',
    path: 'servicos',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <ServicesPage />,
    label: 'Serviços',
    icon: Wrench,
    sidebar: true,
  },
  {
    key: 'servicos-create',
    path: 'servicos/novo',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <ServiceFormPage mode="create" />,
  },
  {
    key: 'servicos-view',
    path: 'servicos/:id',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <ServiceFormPage mode="view" />,
  },
  {
    key: 'servicos-edit',
    path: 'servicos/:id/editar',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <ServiceFormPage mode="edit" />,
  },
  {
    key: 'mecanicos-list',
    path: 'mecanicos',
    roles: ['ADMIN'],
    element: <MechanicsPage />,
    label: 'Mecânicos',
    icon: UserRoundCog,
    sidebar: true,
  },
  {
    key: 'mecanicos-create',
    path: 'mecanicos/novo',
    roles: ['ADMIN'],
    element: <MechanicFormPage mode="create" />,
  },
  {
    key: 'mecanicos-view',
    path: 'mecanicos/:id',
    roles: ['ADMIN'],
    element: <MechanicFormPage mode="view" />,
  },
  {
    key: 'mecanicos-edit',
    path: 'mecanicos/:id/editar',
    roles: ['ADMIN'],
    element: <MechanicFormPage mode="edit" />,
  },
  {
    key: 'financeiro-list',
    path: 'financeiro',
    roles: ['ADMIN', 'FINANCEIRO'],
    element: <FinancialPage />,
    label: 'Financeiro',
    icon: BadgeDollarSign,
    sidebar: true,
    requiresCnpj: true,
  },
  {
    key: 'oficina-profile',
    path: 'oficina',
    roles: ['ADMIN'],
    element: <WorkshopProfilePage />,
    label: 'Oficina',
    icon: Building2,
    sidebar: true,
  },
];

const sidebarOrder = [
  'dashboard',
  'clientes-list',
  'veiculos-list',
  'orcamentos-list',
  'ordens-servico-list',
  'financeiro-list',
  'oficina-profile',
  'servicos-list',
  'estoque-list',
  'mecanicos-list',
] as const;

export function getSidebarRoutes(role?: Role) {
  if (!role) return [];

  return appRoutes
    .filter((route) => route.sidebar && route.roles.includes(role))
    .sort((left, right) => sidebarOrder.indexOf(left.key as (typeof sidebarOrder)[number]) - sidebarOrder.indexOf(right.key as (typeof sidebarOrder)[number]));
}

export function getSidebarMenuRoutes() {
  return appRoutes
    .filter((route) => route.sidebar)
    .sort((left, right) => sidebarOrder.indexOf(left.key as (typeof sidebarOrder)[number]) - sidebarOrder.indexOf(right.key as (typeof sidebarOrder)[number]));
}
