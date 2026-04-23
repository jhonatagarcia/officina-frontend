import type { ComponentType } from 'react';
import {
  CarFront,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { Role } from '@/types/auth';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { ClientsPage } from '@/features/clients/pages/clients-page';
import { ClientFormPage } from '@/features/clients/pages/client-form-page';
import { VehiclesPage } from '@/features/vehicles/pages/vehicles-page';
import { VehicleFormPage } from '@/features/vehicles/pages/vehicle-form-page';
import { BudgetsPage } from '@/features/budgets/pages/budgets-page';
import { BudgetFormPage } from '@/features/budgets/pages/budget-form-page';
import { ServiceOrdersPage } from '@/features/service-orders/pages/service-orders-page';
import { ServiceOrderDetailsPage } from '@/features/service-orders/pages/service-order-details-page';
import { InventoryPage } from '@/features/inventory/pages/inventory-page';
import { InventoryFormPage } from '@/features/inventory/pages/inventory-form-page';
import { FinancialPage } from '@/features/financial/pages/financial-page';
import { ServicesPage } from '@/features/services/pages/services-page';
import { ServiceFormPage } from '@/features/services/pages/service-form-page';
import { VehicleHistoryPage } from '@/features/vehicle-history/pages/vehicle-history-page';
import { MechanicsPage } from '@/features/mechanics/pages/mechanics-page';
import { MechanicFormPage } from '@/features/mechanics/pages/mechanic-form-page';

export interface AppRouteDefinition {
  key: string;
  path: string;
  roles: Role[];
  element: JSX.Element;
  label?: string;
  icon?: ComponentType<{ className?: string }>;
  sidebar?: boolean;
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
    icon: Users,
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
    icon: Receipt,
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
    key: 'ordens-servico-list',
    path: 'ordens-servico',
    roles: ['ADMIN', 'ATENDENTE', 'MECANICO'],
    element: <ServiceOrdersPage />,
    label: 'Ordens de Serviço',
    icon: ClipboardList,
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
    icon: Package,
    sidebar: true,
  },
  {
    key: 'estoque-create',
    path: 'estoque/novo',
    roles: ['ADMIN', 'ATENDENTE'],
    element: <InventoryFormPage />,
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
    icon: Wrench,
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
    icon: Wallet,
    sidebar: true,
  },
];

export function getSidebarRoutes(role?: Role) {
  if (!role) return [];

  return appRoutes.filter((route) => route.sidebar && route.roles.includes(role));
}
