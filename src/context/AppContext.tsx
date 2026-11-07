import {localDateKey} from '../utils/businessInsights';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  Tenant, 
  Professional, 
  Service, 
  Appointment, 
  Customer, 
  FinancialTransaction, 
  BaseCatalogItem, 
  AppointmentStatus,
  UserAccount,
  UserRole,
  InventoryItem,
  MarketingPost,
  ConnectedAccount,
  PortfolioItem,
  PackagePlan,
  CustomerPackage,
  AuditLog,
  BlockedTime,
  WaitingListEntry,
  InventoryMovement,
  BusinessSegment,
  PhysicalResource,
  SubscriptionPlan,
  SaasProfitabilityParams,
  SaasSimulationResult
} from '../types';
import { BUSINESS_SEGMENTS, DEFAULT_SUBSCRIPTION_PLANS } from '../data/businessSegments';

export type AppTab = 
  | 'dashboard' 
  | 'calendar' 
  | 'catalog' 
  | 'customers' 
  | 'inventory'
  | 'marketing'
  | 'financial' 
  | 'packages'
  | 'portfolio'
  | 'whatsapp'
  | 'ai-assistant' 
  | 'settings' 
  | 'super-admin';

interface AppContextType {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  currentUser: UserAccount | null;
  sessionToken: string;
  professionals: Professional[];
  services: Service[];
  appointments: Appointment[];
  customers: Customer[];
  financialTransactions: FinancialTransaction[];
  inventory: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  marketingPosts: MarketingPost[];
  connectedAccounts: ConnectedAccount[];
  portfolio: PortfolioItem[];
  packagePlans: PackagePlan[];
  customerPackages: CustomerPackage[];
  auditLogs: AuditLog[];
  baseCatalog: BaseCatalogItem[];
  blockedTimes: BlockedTime[];
  waitingList: WaitingListEntry[];
  businessSegments: BusinessSegment[];
  currentSegment: BusinessSegment;
  subscriptionPlans: SubscriptionPlan[];
  physicalResources: PhysicalResource[];
  
  activeTab: AppTab;
  currentViewMode: 'saas' | 'public_booking';
  publicBookingSlug: string;
  isOnboardingOpen: boolean;
  isLoading: boolean;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;

  setActiveTab: (tab: AppTab) => void;
  setCurrentViewMode: (mode: 'saas' | 'public_booking') => void;
  setPublicBookingSlug: (slug: string) => void;
  setIsOnboardingOpen: (open: boolean) => void;
  switchTenant: (tenantId: string) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  loginAsRole: (role: UserRole) => Promise<void>;
  login: (email:string,password:string) => Promise<void>;
  logout: () => void;

  createTenant: (data: any) => Promise<Tenant>;
  updateTenant: (id: string, data: Partial<Tenant>) => Promise<Tenant>;
  updateWhatsAppConfig: (mode: 'personal' | 'business_platform', config?: any) => Promise<void>;
  createAppointment: (data: any) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<Appointment>;
  rescheduleAppointment: (id: string, date: string, time: string) => Promise<Appointment>;
  recordNoShow: (id: string) => Promise<Appointment>;
  createBlockedTime: (data: any) => Promise<BlockedTime>;
  deleteBlockedTime: (id: string) => Promise<void>;
  addToWaitingList: (data: any) => Promise<WaitingListEntry>;
  createService: (data: any) => Promise<Service>;
  updateService: (id: string, data: Partial<Service>) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;
  createProfessional: (data: any) => Promise<Professional>;
  createCustomer: (data: any) => Promise<Customer>;
  createFinancialTransaction: (data: any) => Promise<FinancialTransaction>;
  createInventoryItem: (data: any) => Promise<InventoryItem>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<InventoryItem>;
  consumeInventory: (itemId: string, quantity: number, reason?: string, appointmentId?: string) => Promise<void>;
  createMarketingPost: (data: any) => Promise<MarketingPost>;
  createPortfolioItem: (data: any) => Promise<PortfolioItem>;
  createPackagePlan: (data: any) => Promise<PackagePlan>;
  createPhysicalResource: (name: string, type: 'chair' | 'room' | 'stretcher' | 'equipment', capacity?: number) => Promise<any>;
  deletePhysicalResource: (id: string) => Promise<void>;
  directUploadImage: (fileBase64: string, filename: string, type?: 'logo' | 'cover' | 'portfolio' | 'service' | 'general') => Promise<{ success: boolean; url: string; filename: string }>;
  deleteUploadedImage: (url: string) => Promise<void>;
  updateSubscriptionPlans: (plans: SubscriptionPlan[]) => Promise<void>;
  runSaasSimulation: (params: Partial<SaasProfitabilityParams>) => Promise<{ simulation: any; scenarios: any[] }>;
  onboardingSetupWithAi: (specialtyPrompt: string, tenantName?: string, city?: string, businessSegment?: string) => Promise<any>;
  exportMyDataLGPD: () => Promise<void>;
  deleteMyAccountLGPD: () => Promise<void>;
  beginOnboarding: () => Promise<string>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [sessionToken, setSessionToken] = useState<string>(() => {
    return localStorage.getItem('dorange_token') || '';
  });
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const onboardingToken = useRef('');
  const onboardingExpires = useRef(0);
  const onboardingPending = useRef<Promise<string> | null>(null);
  const beginOnboarding = async (): Promise<string> => {
    if (onboardingToken.current && onboardingExpires.current > Date.now()) return onboardingToken.current;
    if (onboardingPending.current) return onboardingPending.current;
    onboardingPending.current = (async () => {
      try {
        const res = await fetch('/api/onboarding/session', { method: 'POST' });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || `Falha (${res.status}) ao iniciar sessão de cadastro`);
        }
        const data = await res.json();
        onboardingToken.current = data.token;
        onboardingExpires.current = data.expiresAt;
        return data.token;
      } catch (err: any) {
        onboardingToken.current = '';
        throw err;
      }
    })();
    try {
      return await onboardingPending.current;
    } finally {
      onboardingPending.current = null;
    }
  };


  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [marketingPosts, setMarketingPosts] = useState<MarketingPost[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [packagePlans, setPackagePlans] = useState<PackagePlan[]>([]);
  const [customerPackages, setCustomerPackages] = useState<CustomerPackage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [baseCatalog, setBaseCatalog] = useState<BaseCatalogItem[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [businessSegments, setBusinessSegments] = useState<BusinessSegment[]>(Object.values(BUSINESS_SEGMENTS));
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(DEFAULT_SUBSCRIPTION_PLANS);
  const [physicalResources, setPhysicalResources] = useState<PhysicalResource[]>([]);
  
  const currentSegment: BusinessSegment = currentTenant?.businessSegment && BUSINESS_SEGMENTS[currentTenant.businessSegment]
    ? BUSINESS_SEGMENTS[currentTenant.businessSegment]
    : BUSINESS_SEGMENTS.nails;

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [currentViewMode, setCurrentViewMode] = useState<'saas' | 'public_booking'>(window.location.pathname.split('/').filter(Boolean).length===1 ? 'public_booking' : 'saas');
  const [publicBookingSlug, setPublicBookingSlug] = useState<string>(decodeURIComponent(window.location.pathname.split('/').filter(Boolean)[0] || 'negocio-exemplo'));
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = sessionToken || localStorage.getItem('dorange_token') || '';
    const headers = new Headers(options.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  }, [sessionToken]);

  const refreshData = async (overrideToken?: string) => {
    if(!localStorage.getItem('dorange_logged_in')){setIsLoading(false);return;}
    const tokenToUse = overrideToken || sessionToken || localStorage.getItem('dorange_token') || '';
    try {
      setIsLoading(true);
      const [tenantsRes, baseCatalogRes, segmentsRes, plansRes] = await Promise.all([
        fetch('/api/tenants', {
          headers: tokenToUse ? { 'Authorization': `Bearer ${tokenToUse}` } : {},
        }),
        fetch('/api/base-catalog'),
        fetch('/api/business-segments').catch(() => null),
        fetch('/api/plans').catch(() => null),
      ]);
      if(!tenantsRes.ok){
        setCurrentUser(null);
        localStorage.removeItem('dorange_token');
        localStorage.removeItem('dorange_logged_in');
        setIsLoading(false);
        return;
      }
      const me = await fetch('/api/auth/me', {
        headers: tokenToUse ? { 'Authorization': `Bearer ${tokenToUse}` } : {},
      });
      if(me.ok) setCurrentUser((await me.json()).user);
      const tenantsData: Tenant[] = await tenantsRes.json();
      const baseCatData: BaseCatalogItem[] = await baseCatalogRes.json();
      setTenants(tenantsData);
      setBaseCatalog(baseCatData);

      if (segmentsRes && segmentsRes.ok) {
        const segData = await segmentsRes.json();
        if (segData.segments) setBusinessSegments(segData.segments);
      }
      if (plansRes && plansRes.ok) {
        const plansData = await plansRes.json();
        if (Array.isArray(plansData)) setSubscriptionPlans(plansData);
      }

      const active = currentTenant 
        ? tenantsData.find((t) => t.id === currentTenant.id) || tenantsData[0] 
        : tenantsData[0];
      
      setCurrentTenant(active || null);

      if (active) {
        const [
          profRes, 
          servRes, 
          appRes, 
          custRes, 
          finRes,
          invRes,
          invMovRes,
          mktPostRes,
          mktAccRes,
          portRes,
          pkgRes,
          cpkgRes,
          auditRes,
          blockedRes,
          waitRes,
          resRes
        ] = await Promise.all([
          authFetch(`/api/professionals?tenantId=${active.id}`),
          authFetch(`/api/services?tenantId=${active.id}`),
          authFetch(`/api/appointments?tenantId=${active.id}`),
          authFetch(`/api/customers?tenantId=${active.id}`),
          authFetch(`/api/financial?tenantId=${active.id}`),
          authFetch(`/api/inventory?tenantId=${active.id}`),
          authFetch(`/api/inventory/movements?tenantId=${active.id}`),
          authFetch(`/api/marketing/posts?tenantId=${active.id}`),
          authFetch(`/api/marketing/accounts?tenantId=${active.id}`),
          authFetch(`/api/portfolio?tenantId=${active.id}`),
          authFetch(`/api/packages/plans?tenantId=${active.id}`),
          authFetch(`/api/packages/customer-subscriptions?tenantId=${active.id}`),
          authFetch(`/api/admin/audit-logs`).catch(() => ({ json: () => [] })),
          authFetch(`/api/appointments/blocked-times?tenantId=${active.id}`),
          authFetch(`/api/appointments/waiting-list?tenantId=${active.id}`),
          authFetch(`/api/resources?tenantId=${active.id}`).catch(() => null),
        ]);

        setProfessionals(await profRes.json());
        setServices(await servRes.json());
        setAppointments(await appRes.json());
        if (custRes.ok) setCustomers(await custRes.json());
        if (finRes.ok) setFinancialTransactions(await finRes.json());
        if (invRes.ok) setInventory(await invRes.json());
        if (invMovRes.ok) setInventoryMovements(await invMovRes.json());
        setMarketingPosts(await mktPostRes.json());
        setConnectedAccounts(await mktAccRes.json());
        setPortfolio(await portRes.json());
        setPackagePlans(await pkgRes.json());
        setCustomerPackages(await cpkgRes.json());
        if ((auditRes as any).ok) setAuditLogs(await (auditRes as any).json());
        if (blockedRes.ok) setBlockedTimes(await blockedRes.json());
        if (waitRes.ok) setWaitingList(await waitRes.json());
        if (resRes && resRes.ok) setPhysicalResources(await resRes.json());
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const switchTenant = async (tenantId: string) => {
    const selected = tenants.find((t) => t.id === tenantId);
    if (!selected) return;
    setCurrentTenant(selected);
    setPublicBookingSlug(selected.slug);

    try {
      setIsLoading(true);
      const [profRes, servRes, appRes, custRes, finRes, invRes, mktPostRes, portRes, pkgRes, blockedRes, waitRes] = await Promise.all([
        authFetch(`/api/professionals?tenantId=${selected.id}`),
        authFetch(`/api/services?tenantId=${selected.id}`),
        authFetch(`/api/appointments?tenantId=${selected.id}`),
        authFetch(`/api/customers?tenantId=${selected.id}`),
        authFetch(`/api/financial?tenantId=${selected.id}`),
        authFetch(`/api/inventory?tenantId=${selected.id}`),
        authFetch(`/api/marketing/posts?tenantId=${selected.id}`),
        authFetch(`/api/portfolio?tenantId=${selected.id}`),
        authFetch(`/api/packages/plans?tenantId=${selected.id}`),
        authFetch(`/api/appointments/blocked-times?tenantId=${selected.id}`),
        authFetch(`/api/appointments/waiting-list?tenantId=${selected.id}`),
      ]);
      setProfessionals(await profRes.json());
      setServices(await servRes.json());
      setAppointments(await appRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (finRes.ok) setFinancialTransactions(await finRes.json());
      if (invRes.ok) setInventory(await invRes.json());
      setMarketingPosts(await mktPostRes.json());
      setPortfolio(await portRes.json());
      setPackagePlans(await pkgRes.json());
      if (blockedRes.ok) setBlockedTimes(await blockedRes.json());
      if (waitRes.ok) setWaitingList(await waitRes.json());
      showNotification(`Conectado ao painel do ${selected.tradeName}`, 'success');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email:string,password:string) => {
    const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const data=await res.json().catch(() => ({}));
    if(!res.ok)throw Error(data.error||'Falha no login');
    localStorage.setItem('dorange_logged_in','true');
    if (data.token) {
      localStorage.setItem('dorange_token', data.token);
      setSessionToken(data.token);
    }
    setCurrentUser(data.user);
    await refreshData(data.token);
  };
  const loginAsRole = async (_role: UserRole) => { showNotification('O perfil é definido pela sua conta autenticada.', 'info'); };
  const logout = async () => {
    await authFetch('/api/auth/logout',{method:'POST'});
    localStorage.removeItem('dorange_token');localStorage.removeItem('dorange_logged_in');setSessionToken('');setCurrentUser(null);setCurrentTenant(null);setTenants([]);
  };

  const createTenant = async (data: any): Promise<Tenant> => {
    const obToken = await beginOnboarding();
    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-onboarding-token': obToken },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 409) {
        throw new Error(err.error || 'Já existe um cadastro ou usuário com este e-mail.');
      }
      if (res.status === 400) {
        throw new Error(err.error || 'Dados de cadastro inválidos ou incompletos.');
      }
      if (res.status === 401) {
        throw new Error(err.error || 'Sessão de cadastro expirada. Tente novamente.');
      }
      if (res.status === 403) {
        throw new Error(err.error || 'Acesso não autorizado para esta operação.');
      }
      if (res.status === 429) {
        throw new Error(err.message || err.error || 'Muitas tentativas de cadastro. Aguarde alguns instantes.');
      }
      throw new Error(err.error || err.message || `Erro no servidor (${res.status}) ao processar o cadastro.`);
    }
    const result = await res.json();
    if (result.token) {
      localStorage.setItem('dorange_token', result.token);
      setSessionToken(result.token);
    }
    localStorage.setItem('dorange_logged_in','true');
    setCurrentUser(result.user);
    onboardingToken.current='';
    if (result.tenant) {
      setTenants((prev) => [result.tenant, ...prev.filter((t) => t.id !== result.tenant.id)]);
      setCurrentTenant(result.tenant);
      setPublicBookingSlug(result.tenant.slug);
    }
    await refreshData(result.token);
    showNotification(`Empresa ${result.tenant.tradeName} criada com sucesso!`, 'success');
    return result.tenant;
  };

  const updateTenant = async (id: string, data: Partial<Tenant>): Promise<Tenant> => {
    const res = await authFetch(`/api/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao salvar configurações do salão');
    const updated = await res.json();
    setCurrentTenant(updated);
    setTenants((prev) => prev.map((t) => (t.id === id ? updated : t)));
    showNotification('Identidade visual e dados salvos no banco!', 'success');
    return updated;
  };

  const updateWhatsAppConfig = async (mode: 'personal' | 'business_platform', config?: any): Promise<void> => {
    if (!currentTenant) return;
    const res = await authFetch(`/api/tenants/${currentTenant.id}/whatsapp-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappMode: mode, whatsappCloudApiConfig: config }),
    });
    if (!res.ok) throw new Error('Erro ao salvar configuração de WhatsApp');
    const updated = await res.json();
    setCurrentTenant(updated);
    showNotification(`Central WhatsApp atualizada para: ${mode === 'personal' ? 'WhatsApp Pessoal (Manual)' : 'WhatsApp Business Oficial'}`, 'success');
  };

  const createAppointment = async (data: any): Promise<Appointment> => {
    const res = await authFetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao realizar agendamento');
    }
    const app: Appointment = await res.json();
    setAppointments((prev) => [app, ...prev]);
    showNotification(`Agendamento de ${app.customerName} confirmado para ${app.date} às ${app.time}!`, 'success');
    if (currentTenant) {
      authFetch(`/api/customers?tenantId=${currentTenant.id}`).then((r) => r.json()).then(setCustomers);
      authFetch(`/api/financial?tenantId=${currentTenant.id}`).then((r) => r.json()).then(setFinancialTransactions);
    }
    return app;
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus): Promise<Appointment> => {
    const res = await authFetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar status');
    const updated = await res.json();
    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    showNotification(`Status alterado para: ${status.toUpperCase()}`, 'info');
    return updated;
  };

  const rescheduleAppointment = async (id: string, date: string, time: string): Promise<Appointment> => {
    const res = await authFetch(`/api/appointments/${id}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao reagendar atendimento.');
    }
    const updated = await res.json();
    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    showNotification(`Agendamento reagendado com sucesso para ${date} às ${time}!`, 'success');
    return updated;
  };

  const recordNoShow = async (id: string): Promise<Appointment> => {
    const res = await authFetch(`/api/appointments/${id}/no-show`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Erro ao registrar não comparecimento.');
    const updated = await res.json();
    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    showNotification('Falta (No-Show) registrada com sucesso.', 'info');
    return updated;
  };

  const createBlockedTime = async (data: any): Promise<BlockedTime> => {
    const res = await authFetch('/api/appointments/blocked-times', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId: currentTenant?.id }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao bloquear horário.');
    }
    const created: BlockedTime = await res.json();
    setBlockedTimes((prev) => [...prev, created]);
    showNotification(`Horário bloqueado na agenda (${created.startTime} às ${created.endTime})!`, 'success');
    return created;
  };

  const deleteBlockedTime = async (id: string): Promise<void> => {
    const res = await authFetch(`/api/appointments/blocked-times/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao remover bloqueio');
    setBlockedTimes((prev) => prev.filter((b) => b.id !== id));
    showNotification('Bloqueio de horário removido da agenda.', 'info');
  };

  const addToWaitingList = async (data: any): Promise<WaitingListEntry> => {
    const res = await authFetch('/api/appointments/waiting-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId: currentTenant?.id }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao registrar na fila de espera.');
    }
    const entry: WaitingListEntry = await res.json();
    setWaitingList((prev) => [entry, ...prev]);
    showNotification(`${entry.customerName} adicionada à fila de espera para ${entry.desiredDate}!`, 'success');
    return entry;
  };

  const createService = async (data: any): Promise<Service> => {
    const res = await authFetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId: currentTenant?.id }),
    });
    if (!res.ok) throw new Error('Erro ao cadastrar serviço');
    const created = await res.json();
    setServices((prev) => [...prev, created]);
    showNotification(`Serviço "${created.name}" adicionado ao catálogo!`, 'success');
    return created;
  };

  const updateService = async (id: string, data: Partial<Service>): Promise<Service> => {
    const res = await authFetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao atualizar serviço');
    const updated = await res.json();
    setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
    await refreshData();
    showNotification(`Serviço "${updated.name}" atualizado!`, 'success');
    return updated;
  };

  const deleteService = async (id: string): Promise<void> => {
    const res = await authFetch(`/api/services/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao remover serviço');
    setServices((prev) => prev.filter((s) => s.id !== id));
    showNotification('Serviço removido do catálogo.', 'info');
  };

  const createProfessional = async (data: any): Promise<Professional> => {
    const res = await authFetch('/api/professionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId: currentTenant?.id }),
    });
    if (!res.ok) throw new Error('Erro ao cadastrar profissional');
    const created = await res.json();
    setProfessionals((prev) => [...prev, created]);
    showNotification(`Profissional "${created.name}" cadastrada!`, 'success');
    return created;
  };

  const createCustomer = async (data: any): Promise<Customer> => {
    const res = await authFetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId: currentTenant?.id }),
    });
    if (!res.ok) throw new Error('Erro ao cadastrar cliente');
    const created = await res.json();
    setCustomers((prev) => [created, ...prev]);
    showNotification(`Cliente "${created.name}" cadastrada com fidelidade ativa!`, 'success');
    return created;
  };

  const createFinancialTransaction = async (data: any): Promise<FinancialTransaction> => {
    const res = await authFetch('/api/financial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId: currentTenant?.id }),
    });
    if (!res.ok) throw new Error('Erro ao lançar movimentação');
    const created = await res.json();
    setFinancialTransactions((prev) => [created, ...prev]);
    showNotification('Lançamento financeiro registrado com sucesso!', 'success');
    return created;
  };

  const createInventoryItem = async (data: any): Promise<InventoryItem> => {
    const res = await authFetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId: currentTenant?.id }),
    });
    if (!res.ok) throw new Error('Erro ao cadastrar item de estoque');
    const created = await res.json();
    setInventory((prev) => [created, ...prev]);
    showNotification(`Produto "${created.name}" adicionado ao estoque!`, 'success');
    return created;
  };

  const updateInventoryItem = async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
    const res = await authFetch(`/api/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao atualizar estoque');
    const updated = await res.json();
    setInventory((prev) => prev.map((i) => (i.id === id ? updated : i)));
    showNotification(`Estoque de "${updated.name}" atualizado (${updated.quantity} ${updated.unit})!`, 'info');
    return updated;
  };

  const consumeInventory = async (itemId: string, quantity: number, reason?: string, appointmentId?: string): Promise<void> => {
    const res = await authFetch('/api/inventory/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity, reason, appointmentId, tenantId: currentTenant?.id }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao registrar consumo de insumo.');
    }
    const { item, movement } = await res.json();
    setInventory((prev) => prev.map((i) => (i.id === itemId ? item : i)));
    if (movement) setInventoryMovements((prev) => [movement, ...prev]);
    showNotification(`Consumo de ${quantity} ${item.unit} registrado no estoque!`, 'info');
  };

  const createMarketingPost = async (data: any): Promise<MarketingPost> => {
    const res = await authFetch('/api/marketing/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId: currentTenant?.id }),
    });
    if (!res.ok) throw new Error('Erro ao salvar post de marketing');
    const created = await res.json();
    setMarketingPosts((prev) => [created, ...prev]);
    showNotification('Post adicionado ao calendário editorial!', 'success');
    return created;
  };

  const createPortfolioItem = async (data: any): Promise<PortfolioItem> => {
    const res = await authFetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId: currentTenant?.id }),
    });
    if (!res.ok) throw new Error('Erro ao cadastrar foto no portfólio');
    const created = await res.json();
    setPortfolio((prev) => [created, ...prev]);
    showNotification('Trabalho adicionado ao portfólio da cliente!', 'success');
    return created;
  };

  const createPackagePlan = async (data: any): Promise<PackagePlan> => {
    const res = await authFetch('/api/packages/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, tenantId: currentTenant?.id }),
    });
    if (!res.ok) throw new Error('Erro ao criar pacote');
    const created = await res.json();
    setPackagePlans((prev) => [...prev, created]);
    showNotification(`Pacote "${created.name}" disponibilizado para venda!`, 'success');
    return created;
  };

  const createPhysicalResource = async (name: string, type: 'chair' | 'room' | 'stretcher' | 'equipment', capacity = 1) => {
    if (!currentTenant) return;
    const res = await authFetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: currentTenant.id, name, type, capacity }),
    });
    if (!res.ok) throw new Error('Erro ao criar recurso físico.');
    const newRes = await res.json();
    setPhysicalResources((prev) => [...prev, newRes]);
    showNotification(`Recurso "${name}" adicionado com sucesso!`, 'success');
    return newRes;
  };

  const deletePhysicalResource = async (id: string) => {
    await authFetch(`/api/resources/${id}`, { method: 'DELETE' });
    setPhysicalResources((prev) => prev.filter((r) => r.id !== id));
    showNotification('Recurso removido.', 'info');
  };

  const directUploadImage = async (fileBase64: string, filename: string, type: 'logo' | 'cover' | 'portfolio' | 'service' | 'general' = 'general') => {

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(isOnboardingOpen ? {'x-onboarding-token':await beginOnboarding()} : {}) },
      body: JSON.stringify({
        tenantId: isOnboardingOpen ? undefined : currentTenant?.id,
        fileBase64,
        filename,
        type,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro no upload da imagem.');
    }
    const data = await res.json();
    showNotification('Imagem enviada e armazenada com sucesso!', 'success');
    return data;
  };

  const deleteUploadedImage = async (url: string) => {

    const deletion = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(isOnboardingOpen ? {'x-onboarding-token':await beginOnboarding()} : {}) },
      body: JSON.stringify({ tenantId: isOnboardingOpen ? undefined : currentTenant?.id, url }),
    });
    if(!deletion.ok)throw Error('Não foi possível excluir a imagem');
    showNotification('Imagem excluída do armazenamento.', 'info');
  };

  const updateSubscriptionPlans = async (plans: SubscriptionPlan[]) => {
    const res = await authFetch('/api/admin/plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plans }),
    });
    if (!res.ok) throw new Error('Erro ao salvar planos comerciais.');
    setSubscriptionPlans(plans);
    showNotification('Planos comerciais SaaS atualizados com sucesso!', 'success');
  };

  const runSaasSimulation = async (params: Partial<SaasProfitabilityParams>) => {
    const res = await authFetch('/api/admin/saas-simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Erro ao calcular simulação SaaS.');
    return await res.json();
  };

  const onboardingSetupWithAi = async (specialtyPrompt: string, tenantName?: string, city?: string, businessSegment?: string): Promise<any> => {
    const res = await authFetch('/api/ai/onboarding-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(isOnboardingOpen?{'x-onboarding-token':await beginOnboarding()}: {}) },
      body: JSON.stringify({ specialtyPrompt, tenantName, city, businessSegment }),
    });
    if (!res.ok) throw new Error('Falha ao gerar configuração com IA.');
    const result = await res.json();
    return result;
  };

  const exportMyDataLGPD = async () => {
    if (!currentTenant) return;
    try {
      const res = await authFetch(`/api/tenants/${currentTenant.id}/export-data`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dorange_dados_${currentTenant.slug}_${localDateKey(new Date())}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('Arquivo de exportação LGPD baixado com sucesso!', 'success');
    } catch (e: any) {
      alert('Erro ao exportar dados.');
    }
  };

  const deleteMyAccountLGPD = async () => {
    if (!currentTenant) return;
    if (confirm(`ATENÇÃO: Deseja realmente excluir definitivamente a conta do salão "${currentTenant.tradeName}" e todos os seus dados conforme a LGPD? Esta ação não pode ser desfeita.`)) {
      try {
        const res = await authFetch(`/api/tenants/${currentTenant.id}/delete-account`, { method: 'DELETE' });
        if (res.ok) {
          alert('Conta e dados excluídos com sucesso.');
          window.location.reload();
        }
      } catch (e: any) {
        alert('Erro ao excluir conta.');
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        tenants,
        currentTenant,
        currentUser,
        sessionToken,
        professionals,
        services,
        appointments,
        customers,
        financialTransactions,
        inventory,
        inventoryMovements,
        marketingPosts,
        connectedAccounts,
        portfolio,
        packagePlans,
        customerPackages,
        auditLogs,
        baseCatalog,
        blockedTimes,
        waitingList,
        businessSegments,
        currentSegment,
        subscriptionPlans,
        physicalResources,
        activeTab,
        currentViewMode,
        publicBookingSlug,
        isOnboardingOpen,
        isLoading,
        notification,
        setActiveTab,
        setCurrentViewMode,
        setPublicBookingSlug,
        setIsOnboardingOpen,
        switchTenant,
        showNotification,
        loginAsRole,
        login,
        logout,
        createTenant,
        updateTenant,
        updateWhatsAppConfig,
        createAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        recordNoShow,
        createBlockedTime,
        deleteBlockedTime,
        addToWaitingList,
        createService,
        updateService,
        deleteService,
        createProfessional,
        createCustomer,
        createFinancialTransaction,
        createInventoryItem,
        updateInventoryItem,
        consumeInventory,
        createMarketingPost,
        createPortfolioItem,
        createPackagePlan,
        createPhysicalResource,
        deletePhysicalResource,
        directUploadImage,
        deleteUploadedImage,
        updateSubscriptionPlans,
        runSaasSimulation,
        onboardingSetupWithAi,
        exportMyDataLGPD,
        deleteMyAccountLGPD,
        beginOnboarding,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado dentro de AppProvider');
  return context;
};
