export type ServiceTypeSetting = 'establishment' | 'domicile' | 'both';

export type UserRole = 'superadmin' | 'owner' | 'manager' | 'professional' | 'customer';

export type BusinessSegmentId = 
  | 'nails' 
  | 'barber' 
  | 'beauty' 
  | 'brows_lashes' 
  | 'esthetics' 
  | 'massage' 
  | 'home_services';

export interface BusinessSegmentTerminology {
  appointmentSingular: string; // "Atendimento" | "Corte" | "Procedimento" | "Sessão" | "Visita"
  appointmentPlural: string;
  professionalSingular: string; // "Nail Designer" | "Barbeiro" | "Cabeleireiro(a)" | "Terapeuta"
  professionalPlural: string;
  serviceSingular: string; // "Serviço" | "Corte" | "Procedimento" | "Sessão"
  servicePlural: string;
  customerSingular: string; // "Cliente"
  clientActionVerb: string; // "Agendar" | "Reservar"
}

export interface BusinessSegment {
  id: BusinessSegmentId;
  code: string;
  name: string;
  tagline: string;
  description: string;
  iconName: string; // Lucide icon identifier
  category: string;
  suggestedServices: BaseCatalogItem[];
  suggestedDurations: { [serviceCategory: string]: number };
  enabledFeatures: {
    packages: boolean;
    loyalty: boolean;
    inventory: boolean;
    portfolio: boolean;
    resources: boolean;
    domicileDisplacement: boolean;
  };
  scheduleModel: 'slots' | 'duration_based' | 'sessions' | 'displacement';
  terminology: BusinessSegmentTerminology;
  defaultSettings?: {
    bufferBetweenMinutes: number;
    displacementFeeBRL?: number;
    defaultDurationMinutes?: number;
  };
}

export interface UserAccount {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password?: string; // legacy: never used for authentication
  passwordHash?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  tradeName: string;
  slug: string;
  document: string; // CPF or CNPJ
  documentType: 'CPF' | 'CNPJ';
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  serviceType: ServiceTypeSetting;
  businessSegment: BusinessSegmentId;
  additionalSegments?: BusinessSegmentId[];
  displacementFeeBRL?: number;
  coverageRegions?: string[];
  address?: string;
  logoUrl?: string;
  coverUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  description?: string;
  instagram?: string;
  planId: 'free' | 'start' | 'pro' | 'studio';
  status: 'active' | 'trial' | 'suspended';
  createdAt: string;
  businessHours: {
    [day: number]: {
      open: boolean;
      start: string;
      end: string;
      breakStart?: string;
      breakEnd?: string;
    };
  };
  bufferBetweenAppointmentsMinutes: number;
  // Configuração WhatsApp
  whatsappMode: 'personal' | 'business_platform';
  whatsappCloudApiConfig?: {
    phoneNumberId?: string;
    wabaId?: string;
    accessToken?: string;
    webhookVerifyToken?: string;
    status: 'connected' | 'disconnected' | 'pending';
  };
  // Configuração Fidelidade
  loyaltyProgramEnabled: boolean;
  loyaltyPointsPerReal: number;
  loyaltyRewardThreshold: number; // ex: 100 pontos = R$ 20 desconto ou serviço
  loyaltyRewardDescription: string;
}

export interface Professional {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  services: string[]; // Service IDs
  bio?: string;
  commissionRate: number; // e.g. 50 (%)
  active: boolean;
  schedule: {
    [day: number]: {
      active: boolean;
      start: string;
      end: string;
      breakStart?: string;
      breakEnd?: string;
    };
  };
}

export interface Service {
  id: string;
  tenantId: string;
  itemType?: 'service' | 'product'; // Universal catalog support
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  costBRL: number; // Custo estimado de materiais
  estimatedMarginPercent: number; // Margem calculada
  imageUrl?: string;
  materialsNeeded?: string[];
  active: boolean;
  professionalIds: string[];
  isPopular?: boolean;
  // Campos para produtos físicos
  sku?: string;
  unit?: string;
  stockQuantity?: number;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  birthdate?: string; // MM-DD
  notes?: string;
  favoriteColors?: string[];
  loyaltyPoints: number;
  marketingConsent: boolean;
  totalSpent: number;
  appointmentsCount: number;
  lastVisit?: string;
  createdAt: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface BlockedTime {
  id: string;
  tenantId: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface WaitingListEntry {
  id: string;
  tenantId: string;
  customerName: string;
  customerPhone: string;
  desiredDate: string;
  serviceName: string;
  notes?: string;
  status: 'waiting' | 'notified' | 'scheduled';
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  tenantId: string;
  inventoryItemId: string;
  type: 'in' | 'out' | 'consumption';
  quantity: number;
  reason: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  price: number;
  status: AppointmentStatus;
  notes?: string;
  isDomicile?: boolean;
  address?: string;
  inspirationPhotoUrl?: string;
  createdAt: string;
  paymentStatus?: 'pending' | 'paid' | 'deposit_paid';
  depositAmount?: number;
}

export interface FinancialTransaction {
  id: string;
  tenantId: string;
  type: 'income' | 'expense' | 'commission';
  category: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  dueDate?: string; // Contas a pagar/receber
  appointmentId?: string;
  professionalId?: string;
  paymentMethod?: 'pix' | 'credit_card' | 'debit_card' | 'cash';
  status: 'paid' | 'pending';
}

export interface PackagePlan {
  id: string;
  tenantId: string;
  name: string;
  serviceId: string;
  serviceName: string;
  totalSessions: number;
  priceTotal: number;
  validityDays: number;
  description: string;
  active: boolean;
}

export interface CustomerPackage {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  packagePlanId: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  purchaseDate: string;
  expirationDate: string;
  pricePaid: number;
  status: 'active' | 'completed' | 'expired';
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  unit: 'un' | 'ml' | 'g' | 'pacote' | 'frasco';
  quantity: number;
  minQuantity: number;
  unitCost: number;
  supplier?: string;
  lastRestockedDate?: string;
}

export interface MarketingPost {
  id: string;
  tenantId: string;
  channel: 'instagram' | 'facebook' | 'tiktok' | 'google_business' | 'whatsapp';
  type: 'feed' | 'story' | 'reels' | 'status';
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  videoScript?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
  metrics?: {
    reach?: number;
    likes?: number;
    clicks?: number;
    appointmentsBooked?: number;
  };
}

export interface ConnectedAccount {
  id: string;
  tenantId: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'google_business' | 'whatsapp_cloud';
  accountName: string;
  accountId: string;
  status: 'connected' | 'disconnected' | 'action_required';
  permissions: string[];
  lastSyncAt: string;
}

export interface PortfolioItem {
  id: string;
  tenantId: string;
  title: string;
  category: string;
  imageUrl: string;
  serviceId?: string;
  description?: string;
  likes: number;
  publishedToPortal: boolean;
  createdAt: string;
}

export interface PhysicalResource {
  id: string;
  tenantId: string;
  name: string;
  type: 'chair' | 'room' | 'stretcher' | 'equipment';
  capacity: number;
  active: boolean;
}

export interface SubscriptionPlan {
  id: 'free' | 'start' | 'pro' | 'studio';
  name: string;
  priceMonthly: number;
  appointmentsLimit: number;
  maxProfessionals: number;
  aiCreditsLimit: number;
  features: string[];
}

export interface SaasProfitabilityParams {
  freePrice: number;
  startPrice: number;
  proPrice: number;
  studioPrice: number;
  subscribersFree: number;
  subscribersStart: number;
  subscribersPro: number;
  subscribersStudio: number;
  hostingMonthlyCost: number;
  databaseMonthlyCost: number;
  storagePerTenantCost: number;
  aiCostPerTenant: number;
  whatsappCostPerTenant: number;
  paymentGatewayFeePercent: number; // e.g. 2.99
  taxRatePercent: number; // e.g. 6.0
  supportCostPerTenant: number;
  fixedMonthlyCosts: number;
  monthlyChurnPercent: number;
  estimatedCacBRL: number;
}

export interface SaasSimulationResult {
  totalTenants: number;
  payingTenants: number;
  mrr: number;
  arr: number;
  revenueByPlan: {
    free: number;
    start: number;
    pro: number;
    studio: number;
  };
  variableCostsTotal: number;
  variableCostBreakdown: {
    hosting: number;
    database: number;
    storage: number;
    ai: number;
    whatsapp: number;
    paymentFees: number;
    taxes: number;
    support: number;
  };
  totalMonthlyExpenses: number;
  contributionMargin: number; // MRR - variable costs
  contributionMarginPercent: number;
  estimatedOperatingProfit: number;
  operatingProfitMarginPercent: number;
  breakEvenTenants: number;
  arpu: number;
  estimatedLtvBRL: number;
  ltvToCacRatio: number;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  userRole?: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface BaseCatalogItem {
  name: string;
  category: string;
  defaultDurationMinutes: number;
  suggestedPriceBRL: number;
  estimatedCostBRL: number;
  estimatedMarginPercent: number;
  description: string;
  materialsNeeded: string[];
  imageUrl?: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionProposal?: {
    type: 'create_appointment' | 'create_service' | 'create_expense' | 'create_post';
    data: any;
    label: string;
  };
}
