export type ExpansionStatus =
  | 'planned'
  | 'development'
  | 'pilot'
  | 'released';

export type ExpansionCapability =
  | 'appointments'
  | 'catalog'
  | 'inventory'
  | 'orders'
  | 'payments'
  | 'delivery'
  | 'crm'
  | 'marketing'
  | 'ai'
  | 'age_verification';

export interface SegmentExpansion {
  id: string;
  name: string;
  family: 'services' | 'retail' | 'food';
  status: ExpansionStatus;
  capabilities: ExpansionCapability[];
  requiresComplianceReview: boolean;
}

export const SEGMENT_EXPANSIONS: SegmentExpansion[] = [
  {
    id: 'specialty_retail',
    name: 'Comercio especializado',
    family: 'retail',
    status: 'planned',
    capabilities: [
      'catalog', 'inventory', 'orders',
      'payments', 'crm', 'marketing', 'ai'
    ],
    requiresComplianceReview: false
  },
  {
    id: 'religious_retail',
    name: 'Floras e artigos religiosos',
    family: 'retail',
    status: 'planned',
    capabilities: [
      'catalog', 'inventory', 'orders',
      'payments', 'delivery', 'crm', 'marketing', 'ai'
    ],
    requiresComplianceReview: false
  },
  {
    id: 'beverage_retail',
    name: 'Adegas e bebidas',
    family: 'retail',
    status: 'planned',
    capabilities: [
      'catalog', 'inventory', 'orders',
      'payments', 'delivery', 'crm',
      'marketing', 'ai', 'age_verification'
    ],
    requiresComplianceReview: true
  },
  {
    id: 'food_delivery',
    name: 'Alimentacao e delivery',
    family: 'food',
    status: 'planned',
    capabilities: [
      'catalog', 'inventory', 'orders',
      'payments', 'delivery', 'crm', 'marketing', 'ai'
    ],
    requiresComplianceReview: true
  },
  {
    id: 'fitness',
    name: 'Academias e studios fitness',
    family: 'services',
    status: 'planned',
    capabilities: [
      'appointments', 'payments',
      'crm', 'marketing', 'ai'
    ],
    requiresComplianceReview: false
  }
];