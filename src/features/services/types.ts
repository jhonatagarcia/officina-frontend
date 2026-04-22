export type ServiceBillingType = 'LABOR_ONLY' | 'PARTS_AND_LABOR' | 'FIXED_PRICE';

export type ServiceMaterialSource =
  | 'SHOP_SUPPLIES'
  | 'CUSTOMER_SUPPLIES'
  | 'NO_PARTS_REQUIRED'
  | 'FLEXIBLE';

export interface ServiceCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  internalNotes: string | null;
  laborPrice: number;
  productPrice: number;
  suggestedTotalPrice: number;
  billingType: ServiceBillingType;
  materialSource: ServiceMaterialSource;
  warrantyDays: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
