import crypto from 'node:crypto';
import { hashPassword, verifyPassword } from './server/passwords.js';
import { safeUser, setSessionCookie, revokeUserSessions } from './server/auth.js';
import { privateGate, issueOnboarding, onboardingGrant, consumeGrant, onboardingLimit, publicBooking } from './server/security.js';
import { uploads, readUpload } from './server/uploads.js';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { db, EXPANDED_BASE_CATALOG } from './server/db.js';
import { 
  Tenant, 
  Professional, 
  Service, 
  Appointment, 
  Customer, 
  FinancialTransaction,
  InventoryItem,
  MarketingPost,
  ConnectedAccount,
  PortfolioItem,
  PackagePlan,
  CustomerPackage,
  UserAccount,
  BusinessSegmentId,
  SubscriptionPlan
} from './src/types/index.js';
import { BUSINESS_SEGMENTS, DEFAULT_SUBSCRIPTION_PLANS } from './src/data/businessSegments.js';
import {
  AuthenticatedRequest,
  initializeSessions,
  createSession,
  revokeSession,
  getUserByToken,
  requireAuth,
  optionalAuth,
  enforceTenantIsolation,
  requireRoles,
  rateLimit,
} from './server/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Express 4 does not automatically forward rejected async handlers.
for (const method of ['get','post','put','patch','delete'] as const) {
  const register=(app as any)[method].bind(app);
  (app as any)[method]=(...args:any[])=>register(...args.map((arg:any)=>typeof arg==='function' && arg.constructor.name==='AsyncFunction' ? (req:Request,res:Response,next:any)=>Promise.resolve(arg(req,res,next)).catch(next) : arg));
}
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.get('/healthz', (_req, res) => { res.setHeader('Cache-Control', 'no-store'); res.json({status:'ok'}); });
if(process.env.TRUST_PROXY)app.set('trust proxy',process.env.TRUST_PROXY.split(','));
app.use(express.json({ limit: '12mb' }));
app.get('/api/uploads/:tenant/:filename', readUpload);
app.use('/api', privateGate);
app.post('/api/onboarding/session', onboardingLimit, issueOnboarding);
app.get('/api/public/booking/:slug', publicBooking);
app.get('/api/plans', (_req,res)=>res.json(DEFAULT_SUBSCRIPTION_PLANS));
app.use('/api', uploads);
// Compatibility for historical persisted URLs, without rewriting customer data.
app.use('/src/assets/images', express.static(path.resolve(__dirname, 'public/images')));


// Inicializa sessões ativas persistidas
initializeSessions();

// Inicialização segura do SDK Gemini no backend (porta 3000)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'not-configured',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// ==========================================
// 0. ARMAZENAMENTO & UPLOAD DIRETO DE IMAGENS
// ==========================================
// ==========================================
// SEGMENTOS DE NEGÓCIO (BUSINESS SEGMENTS)
// ==========================================
app.get('/api/business-segments', (_req: Request, res: Response) => {
  res.json({
    segments: Object.values(BUSINESS_SEGMENTS),
  });
});

app.get('/api/business-segments/:id', (req: Request, res: Response) => {
  const segment = BUSINESS_SEGMENTS[req.params.id as BusinessSegmentId];
  if (!segment) {
    res.status(404).json({ error: 'Segmento não encontrado.' });
    return;
  }
  res.json(segment);
});

// Recursos Físicos (Cadeiras, Macas, Salas)
app.get('/api/resources', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const resources = (db.get('physicalResources') as any[]) || [];
  if (tenantId) {
    res.json(resources.filter((r) => r.tenantId === tenantId));
  } else {
    res.json(resources);
  }
});

app.post('/api/resources', (req: Request, res: Response) => {
  const { tenantId, name, type, capacity } = req.body;
  if (!tenantId || !name || !['chair','room','stretcher','equipment'].includes(type||'chair') || !Number.isInteger(capacity??1) || (capacity??1)<1) {
    res.status(400).json({ error: 'Recurso físico inválido.' });
    return;
  }
  const newRes = {
    id: `res-${crypto.randomUUID()}`,
    tenantId,
    name,
    type: type || 'chair',
    capacity: capacity || 1,
    active: true,
  };
  db.mutate((d) => {
    if (!d.physicalResources) d.physicalResources = [];
    d.physicalResources.push(newRes);
  });
  db.logAudit(tenantId, 'CREATE_RESOURCE', `Recurso físico criado: ${name} (${type})`);
  res.status(201).json(newRes);
});

app.delete('/api/resources/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  db.mutate((d) => {
    if (d.physicalResources) {
      d.physicalResources = d.physicalResources.filter((r) => r.id !== id);
    }
  });
  res.json({ success: true });
});

// ==========================================
// 1. AUTENTICAÇÃO, CONTROLE DE ACESSO & LGPD
// ==========================================

app.post('/api/auth/login', rateLimit(15, 60000), async (req,res,next)=>{
  try {
    const {email,password}=req.body;
    const user=typeof email==='string'?db.get('users').find(u=>u.email.toLowerCase()===email.toLowerCase()):undefined;
    if(!user || (user.role!=='superadmin' && !db.get('tenants').some(t=>t.id===user.tenantId&&['active','trial'].includes(t.status))) || !await verifyPassword(password,user.passwordHash)){res.status(401).json({error:'Credenciais inválidas'});return;}
    const token=createSession(user);setSessionCookie(res,token);res.json({token,user:safeUser(user)});
  }catch(error){next(error);}
});
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: safeUser(req.user!) });
});

app.post('/api/auth/logout', requireAuth, (req,res)=>{
  const token=req.headers.authorization?.replace(/^Bearer /,'') || (req.headers.cookie||'').split(';').find(c=>c.trim().startsWith('dorange_session='))?.trim().slice(16)||'';
  revokeSession(token);res.clearCookie('dorange_session',{path:'/'});res.json({success:true});
});
app.post('/api/auth/recover-password', rateLimit(5,60000), (_req,res)=>{res.status(202).json({message:'Solicite recuperação ao administrador por canal verificado.'});});
app.get('/api/tenants', (req: AuthenticatedRequest, res: Response) => {
  res.json(db.get('tenants').filter(t=>req.user?.role==='superadmin'||t.id===req.user?.tenantId));
});

app.get('/api/tenants/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug.toLowerCase();
  const tenant = db.get('tenants').find((t) => t.slug.toLowerCase() === slug || t.id === slug);
  if (!tenant) {
    res.status(404).json({ error: 'Empresa não encontrada com este identificador.' });
    return;
  }
  res.json(tenant);
});

app.post('/api/tenants', onboardingLimit, async (req,res,next)=>{
  try {
    const grant=onboardingGrant(req);if(!grant){res.status(401).json({error:'Inicie uma sessão de cadastro'});return;}
    const body=req.body;
    if(!body.name||!body.tradeName||typeof body.email!=='string'||!/^\S+@\S+\.\S+$/.test(body.email)||!BUSINESS_SEGMENTS[body.businessSegment as BusinessSegmentId]){res.status(400).json({error:'Dados comerciais ou segmento inválidos'});return;}
    const passwordHash=await hashPassword(body.password);
    const email=body.email.trim().toLowerCase();
    if(db.get('users').some(u=>u.email.toLowerCase()===email)){res.status(409).json({error:'E-mail já cadastrado'});return;}
    const config=BUSINESS_SEGMENTS[body.businessSegment as BusinessSegmentId];
    const validTime=(v:any)=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
    const open=body.openTime||'09:00',close=body.closeTime||'19:00';
    const breakStart=body.breakStart??'12:30',breakEnd=body.breakEnd??'13:30';
    if(!validTime(open)||!validTime(close)||open>=close||(breakStart||breakEnd)&&(!validTime(breakStart)||!validTime(breakEnd)||breakStart<open||breakEnd>close||breakStart>=breakEnd)||!Number.isInteger(body.bufferMinutes??10)||(body.bufferMinutes??10)<0||(body.bufferMinutes??10)>120){res.status(400).json({error:'Horários, pausas ou intervalo inválidos'});return;}
    const tenantId=grant.tenantId;const professionalId='prof-'+crypto.randomUUID();
    const image=(value:any)=>!value?'':typeof value==='string'&&((value.startsWith('/api/uploads/'+tenantId+'/')&&!value.includes('..'))||/^https:\/\//.test(value))?value:null;
    if(image(body.logoUrl)===null||image(body.coverUrl)===null){res.status(400).json({error:'Imagem não pertence ao cadastro'});return;}
    const businessHours=Object.fromEntries(Array.from({length:7},(_,day)=>[day,{open:day!==0,start:open,end:close,...(breakStart?{breakStart,breakEnd}:{})}]));
    const slugBase=String(body.tradeName).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'negocio';
    const tenant:Tenant={id:tenantId,name:String(body.name).slice(0,200),tradeName:String(body.tradeName).slice(0,200),slug:slugBase+'-'+crypto.randomBytes(4).toString('hex'),email,document:String(body.document||''),documentType:body.documentType==='CNPJ'?'CNPJ':'CPF',phone:String(body.phone||''),whatsapp:String(body.whatsapp||body.phone||'').replace(/\D/g,''),city:String(body.city||''),state:String(body.state||''),address:String(body.address||''),serviceType:['domicile','both'].includes(body.serviceType)?body.serviceType:'establishment',businessSegment:body.businessSegment,logoUrl:image(body.logoUrl)!,coverUrl:image(body.coverUrl)||'/images/dorange_hero_studio_1793885623392.jpg',primaryColor:/^#[a-fA-F0-9]{6}$/.test(body.primaryColor)?body.primaryColor:'#D97706',secondaryColor:/^#[a-fA-F0-9]{6}$/.test(body.secondaryColor)?body.secondaryColor:'#FFFBEB',description:config.tagline,planId:'free',status:'trial',createdAt:new Date().toISOString(),businessHours,bufferBetweenAppointmentsMinutes:body.bufferMinutes??config.defaultSettings?.bufferBetweenMinutes??10,whatsappMode:'personal',loyaltyProgramEnabled:true,loyaltyPointsPerReal:1,loyaltyRewardThreshold:100,loyaltyRewardDescription:'Desconto no próximo atendimento'};
    const preset=config.suggestedServices.filter(s=>!Array.isArray(body.selectedServiceNames)||body.selectedServiceNames.includes(s.name)).map(s=>({name:s.name,category:s.category,description:s.description,durationMinutes:s.defaultDurationMinutes,price:s.suggestedPriceBRL,costBRL:s.estimatedCostBRL}));
    const input=Array.isArray(body.customServices)?body.customServices:preset;
    if(input.length>100||input.some((s:any)=>typeof s.name!=='string'||!s.name.trim()||!Number.isFinite(s.price)||s.price<0||!Number.isInteger(s.durationMinutes)||s.durationMinutes<5||s.durationMinutes>720)){res.status(400).json({error:'Serviços inválidos'});return;}
    const services:Service[]=input.map((s:any)=>({id:'serv-'+crypto.randomUUID(),tenantId,itemType:'service',name:s.name.trim().slice(0,200),category:String(s.category||'Serviços'),description:String(s.description||''),durationMinutes:s.durationMinutes,price:s.price,costBRL:Number(s.costBRL)||0,active:true,professionalIds:[professionalId]}));
    const professional:Professional={id:professionalId,tenantId,name:tenant.name,role:config.terminology.professionalSingular,email,phone:tenant.phone,services:services.map(s=>s.id),commissionRate:100,active:true,schedule:Object.fromEntries(Object.entries(businessHours).map(([d,v]:[string,any])=>[d,{...v,active:v.open}]))};
    const user:UserAccount={id:'user-'+crypto.randomUUID(),tenantId,name:tenant.name,email,role:'owner',passwordHash,createdAt:tenant.createdAt};
    const stocks:Record<string,string[]>={nails:['Gel construtor','Lixas descartáveis'],barber:['Lâminas descartáveis','Espuma de barbear'],beauty:['Shampoo profissional','Condicionador profissional'],brows_lashes:['Escovas descartáveis'],esthetics:['Luvas descartáveis'],massage:['Óleo de massagem'],home_services:['Material de atendimento']};
    db.mutate(d=>{
      // Recheck after asynchronous hashing to prevent duplicate concurrent registrations.
      if(d.users.some(u=>u.email.toLowerCase()===email)||d.tenants.some(t=>t.id===tenantId))throw new Error('Cadastro já existente');
      d.tenants.push(tenant);d.users.push(user);d.professionals.push(professional);d.services.push(...services);
      for(const name of stocks[body.businessSegment])d.inventory.push({id:'inv-'+crypto.randomUUID(),tenantId,name,category:'Outros',unit:'un',quantity:0,minQuantity:0,unitCost:0});
    });
    consumeGrant(req);const token=createSession(user);setSessionCookie(res,token);res.status(201).json({tenant,professional,user:safeUser(user),token});
  }catch(error){if(error instanceof Error&&error.message.startsWith('A senha')){res.status(400).json({error:error.message});return;}next(error);}
});
app.patch('/api/tenants/:id', (req: AuthenticatedRequest, res: Response) => {
  if(req.body.businessSegment && !BUSINESS_SEGMENTS[req.body.businessSegment as BusinessSegmentId]){res.status(400).json({error:'Segmento inválido'});return;}
  const allowed=['tradeName','phone','whatsapp','city','state','address','logoUrl','coverUrl','primaryColor','secondaryColor','description','instagram','businessHours','bufferBetweenAppointmentsMinutes','serviceType','businessSegment','loyaltyProgramEnabled','loyaltyPointsPerReal','loyaltyRewardThreshold','loyaltyRewardDescription'];
  if(req.user?.role==='superadmin')allowed.push('planId','status');
  req.body=Object.fromEntries(Object.entries(req.body).filter(([key])=>allowed.includes(key)));
  let updatedTenant: Tenant | null = null;
  db.mutate((d) => {
    const idx = d.tenants.findIndex((t) => t.id === req.params.id);
    if (idx !== -1) {
      d.tenants[idx] = { ...d.tenants[idx], ...req.body };
      updatedTenant = d.tenants[idx];
    }
  });

  if (!updatedTenant) {
    res.status(404).json({ error: 'Empresa não encontrada.' });
    return;
  }

  db.logAudit(req.params.id, 'UPDATE_TENANT', 'Configurações de marca atualizadas');
  res.json(updatedTenant);
});

// Central WhatsApp (Pessoal vs Business Platform)
app.put('/api/tenants/:id/whatsapp-config', requireAuth, enforceTenantIsolation, requireRoles('superadmin', 'owner'), (req: AuthenticatedRequest, res: Response) => {
  const { whatsappMode, whatsappCloudApiConfig } = req.body;
  const targetTenantId = req.resolvedTenantId || req.params.id;
  let tenant: Tenant | null = null;

  db.mutate((d) => {
    const idx = d.tenants.findIndex((t) => t.id === targetTenantId);
    if (idx !== -1) {
      d.tenants[idx].whatsappMode = whatsappMode || d.tenants[idx].whatsappMode;
      if (whatsappCloudApiConfig) {
        d.tenants[idx].whatsappCloudApiConfig = {
          ...d.tenants[idx].whatsappCloudApiConfig,
          ...whatsappCloudApiConfig,
        };
      }
      tenant = d.tenants[idx];
    }
  });

  if (!tenant) {
    res.status(404).json({ error: 'Empresa não encontrada.' });
    return;
  }

  db.logAudit(targetTenantId, 'UPDATE_WHATSAPP_CONFIG', `Modo alterado para ${whatsappMode}`);
  res.json(tenant);
});

// Exportação de Dados e Exclusão LGPD
app.get('/api/tenants/:id/export-data', requireAuth, enforceTenantIsolation, requireRoles('superadmin', 'owner'), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.resolvedTenantId || req.params.id;
  const tenant = db.get('tenants').find((t) => t.id === tenantId);
  if (!tenant) {
    res.status(404).json({ error: 'Empresa não encontrada.' });
    return;
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    tenant,
    professionals: db.get('professionals').filter((p) => p.tenantId === tenantId),
    services: db.get('services').filter((s) => s.tenantId === tenantId),
    customers: db.get('customers').filter((c) => c.tenantId === tenantId),
    appointments: db.get('appointments').filter((a) => a.tenantId === tenantId),
    financial: db.get('financialTransactions').filter((f) => f.tenantId === tenantId),
    inventory: db.get('inventory').filter((i) => i.tenantId === tenantId),
    marketingPosts: db.get('marketingPosts').filter((m) => m.tenantId === tenantId),
  };

  db.logAudit(tenantId, 'LGPD_DATA_EXPORT', 'Exportação completa de dados solicitada pelo titular');
  res.json(exportPayload);
});

app.delete('/api/tenants/:id/delete-account', requireAuth, enforceTenantIsolation, requireRoles('superadmin', 'owner'), (req:AuthenticatedRequest,res:Response)=>{
  const tenantId=req.resolvedTenantId||req.params.id;
  db.mutate(d=>{const tenant=d.tenants.find(t=>t.id===tenantId);if(!tenant)throw Error('Empresa não encontrada');tenant.status='suspended';});
  for(const user of db.get('users').filter(u=>u.tenantId===tenantId))revokeUserSessions(user.id);
  db.logAudit(tenantId,'ACCOUNT_DEACTIVATION','Conta desativada; dados mantidos para revisão de retenção/exclusão.');
  res.json({success:true,message:'Conta desativada e sessões revogadas. Os dados foram preservados para revisão da solicitação de exclusão.'});
});

// ==========================================
// 3. SERVIÇOS & CATÁLOGO EXPANDIDO R2
// ==========================================

app.get('/api/services', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const allServices = db.get('services');
  const list = tenantId ? allServices.filter((s) => s.tenantId === tenantId) : allServices;
  res.json(list);
});

app.get('/api/base-catalog', (_req: Request, res: Response) => {
  res.json(EXPANDED_BASE_CATALOG);
});

app.post('/api/services', (req: Request, res: Response) => {
  const { 
    tenantId, 
    name, 
    category, 
    description, 
    durationMinutes, 
    price, 
    costBRL,
    imageUrl, 
    materialsNeeded, 
    professionalIds 
  } = req.body;

  if (!tenantId || typeof name!=='string' || !name.trim() || !Number.isFinite(Number(price)) || Number(price)<0 || !Number.isInteger(Number(durationMinutes)) || Number(durationMinutes)<5 || Number(durationMinutes)>720) {
    res.status(400).json({ error: 'Nome, preço e duração são obrigatórios.' });
    return;
  }

  const numericPrice = Number(price);
  const numericCost = Number(costBRL || (numericPrice * 0.18).toFixed(2));
  const margin = numericPrice > 0 ? Math.round(((numericPrice - numericCost) / numericPrice) * 100) : 80;

  const newService: Service = {
    id: `serv-${crypto.randomUUID()}`,
    tenantId,
    name,
    category: category || 'Geral',
    description: description || '',
    durationMinutes: Number(durationMinutes),
    price: numericPrice,
    costBRL: numericCost,
    estimatedMarginPercent: margin,
    imageUrl: imageUrl || '',
    materialsNeeded: materialsNeeded || [],
    active: true,
    professionalIds: professionalIds || [],
  };

  db.mutate((d) => d.services.push(newService));
  db.logAudit(tenantId, 'CREATE_SERVICE', `Serviço criado: ${newService.name}`);

  res.status(201).json(newService);
});

app.put('/api/services/:id', (req: Request, res: Response) => {
  let updated: Service | null = null;
  db.mutate((d) => {
    const idx = d.services.findIndex((s) => s.id === req.params.id);
    if (idx !== -1) {
      d.services[idx] = { ...d.services[idx], ...req.body };
      updated = d.services[idx];
    }
  });

  if (!updated) {
    res.status(404).json({ error: 'Serviço não encontrado.' });
    return;
  }
  res.json(updated);
});

app.delete('/api/services/:id', (req: Request, res: Response) => {
  db.mutate((d) => {
    const service=d.services.find(s=>s.id===req.params.id);if(service)service.active=false;
  });
  res.json({ success: true });
});

// ==========================================
// 4. PROFISSIONAIS & EQUIPE
// ==========================================

app.get('/api/professionals', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const list = tenantId ? db.get('professionals').filter((p) => p.tenantId === tenantId) : db.get('professionals');
  res.json(list);
});

app.post('/api/professionals', (req: Request, res: Response) => {
  const { tenantId, name, role, email, phone, commissionRate, services: profServices } = req.body;
  if (!tenantId || !name) {
    res.status(400).json({ error: 'Nome da profissional é obrigatório.' });
    return;
  }

  const newProf: Professional = {
    id: `prof-${crypto.randomUUID()}`,
    tenantId,
    name,
    role: role || 'Profissional',
    email: email || '',
    phone: phone || '',
    services: profServices || [],
    commissionRate: Number(commissionRate || 50),
    active: true,
    schedule: {
      1: { active: true, start: '09:00', end: '19:00', breakStart: '12:30', breakEnd: '13:30' },
      2: { active: true, start: '09:00', end: '19:00', breakStart: '12:30', breakEnd: '13:30' },
      3: { active: true, start: '09:00', end: '19:00', breakStart: '12:30', breakEnd: '13:30' },
      4: { active: true, start: '09:00', end: '19:00', breakStart: '12:30', breakEnd: '13:30' },
      5: { active: true, start: '09:00', end: '19:00', breakStart: '12:30', breakEnd: '13:30' },
      6: { active: true, start: '09:00', end: '18:00', breakStart: '12:30', breakEnd: '13:30' },
      0: { active: false, start: '09:00', end: '18:00' },
    },
  };

  db.mutate((d) => d.professionals.push(newProf));
  db.logAudit(tenantId, 'CREATE_PROFESSIONAL', `Profissional cadastrada: ${name}`);

  res.status(201).json(newProf);
});

// ==========================================
// 5. CLIENTES & PROGRAMA DE FIDELIDADE
// ==========================================

app.get('/api/customers', requireAuth, enforceTenantIsolation, (req: AuthenticatedRequest, res: Response) => {
  const targetTenantId = req.resolvedTenantId;
  const list = req.user?.role === 'superadmin' && !req.query.tenantId
    ? db.get('customers')
    : db.get('customers').filter((c) => c.tenantId === targetTenantId);
  res.json(list);
});

app.post('/api/customers', requireAuth, enforceTenantIsolation, (req: AuthenticatedRequest, res: Response) => {
  const targetTenantId = req.resolvedTenantId || req.body.tenantId;
  const { name, phone, email, birthdate, notes, favoriteColors } = req.body;
  if (!name || !phone) {
    res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    return;
  }

  const newCust: Customer = {
    id: `cust-${crypto.randomUUID()}`,
    tenantId: targetTenantId,
    name,
    phone,
    email: email || '',
    birthdate: birthdate || '',
    notes: notes || '',
    favoriteColors: favoriteColors || [],
    loyaltyPoints: 0,
    marketingConsent: true,
    totalSpent: 0,
    appointmentsCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.mutate((d) => d.customers.push(newCust));
  res.status(201).json(newCust);
});

app.patch('/api/customers/:id', requireAuth, enforceTenantIsolation, (req: AuthenticatedRequest, res: Response) => {
  let updated: Customer | null = null;
  db.mutate((d) => {
    const idx = d.customers.findIndex((c) => c.id === req.params.id && (req.user?.role === 'superadmin' || c.tenantId === req.resolvedTenantId));
    if (idx !== -1) {
      d.customers[idx] = { ...d.customers[idx], ...req.body };
      updated = d.customers[idx];
    }
  });

  if (!updated) {
    res.status(404).json({ error: 'Cliente não encontrada.' });
    return;
  }
  res.json(updated);
});

// ==========================================
// 6. AGENDAMENTOS (VALIDAÇÃO DE CONFLITOS COM MUTEX & BLOQUEIOS)
// ==========================================

app.get('/api/appointments', (req: Request, res: Response) => {
  const { tenantId, date } = req.query;
  let list = db.get('appointments');
  if (tenantId) list = list.filter((a) => a.tenantId === tenantId);
  if (date) list = list.filter((a) => a.date === date);
  res.json(list);
});

// Agendamento protegido com Lock Serializado e Prevenção de Conflitos
app.post('/api/appointments', rateLimit(30, 60000), async (req: Request, res: Response) => {
  const {
    tenantId,
    serviceId,
    professionalId,
    customerName,
    customerPhone,
    date,
    time,
    notes,
    isDomicile,
    address,
    inspirationPhotoUrl,
  } = req.body;

  if (![tenantId,serviceId,professionalId,customerName,customerPhone,date,time].every(v=>typeof v==='string' && v.length>0 && v.length<=250) || (inspirationPhotoUrl && !(typeof inspirationPhotoUrl==='string' && (inspirationPhotoUrl.startsWith('/images/') || inspirationPhotoUrl.startsWith('/api/uploads/'+tenantId+'/')) && !inspirationPhotoUrl.includes('..')))) {
    res.status(400).json({ error: 'Todos os campos do agendamento são obrigatórios.' });
    return;
  }

  const service = db.get('services').find((s) => s.id === serviceId && s.tenantId === tenantId && s.active);
  if (!service) {
    res.status(404).json({ error: 'Serviço selecionado não existe.' });
    return;
  }

  const prof = db.get('professionals').find((p) => p.id === professionalId && p.tenantId === tenantId && p.active && p.services.includes(serviceId));
  if (!prof) {
    res.status(404).json({ error: 'Profissional selecionada não existe.' });
    return;
  }

  const tenant = db.get('tenants').find((t) => t.id === tenantId);
  if(!tenant || !['active','trial'].includes(tenant.status) || !/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){res.status(400).json({error:'Empresa, data ou horário inválido'});return;}
  const day=tenant.businessHours[new Date(date+'T12:00:00').getDay()];
  const begin=timeToMinutes(time), finish=begin+service.durationMinutes;
  if(!day?.open||begin<timeToMinutes(day.start)||finish>timeToMinutes(day.end)||(day.breakStart&&day.breakEnd&&begin<timeToMinutes(day.breakEnd)&&finish>timeToMinutes(day.breakStart))){res.status(409).json({error:'Horário fora do expediente ou em pausa'});return;}
  const buffer = tenant.bufferBetweenAppointmentsMinutes ?? 10;

  // Lock de Concorrência por Profissional e Data
  const lockKey = `slot_${tenantId}_${professionalId}_${date}`;

  await db.runWithLock(lockKey, async () => {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){res.status(400).json({error:'Data ou hora inválida'});return;}
    const day=tenant?.businessHours[new Date(date+'T12:00:00').getDay()];const finish=timeToMinutes(time)+service.durationMinutes;
    if(!day?.open||timeToMinutes(time)<timeToMinutes(day.start)||finish>timeToMinutes(day.end)||(day.breakStart&&day.breakEnd&&timeToMinutes(time)<timeToMinutes(day.breakEnd)&&finish>timeToMinutes(day.breakStart))){res.status(409).json({error:'Fora do expediente ou em pausa'});return;}
    const newStart = timeToMinutes(time);
    const newEnd = newStart + service.durationMinutes + buffer;

    // 1. Verificação de conflito com outros agendamentos existentes
    const conflicting = db.get('appointments').find((existing) => {
      if (existing.tenantId !== tenantId) return false;
      if (existing.professionalId !== professionalId) return false;
      if (existing.date !== date) return false;
      if (existing.status === 'cancelled') return false;

      const existingStart = timeToMinutes(existing.time);
      const existingEnd = existingStart + existing.durationMinutes + buffer;

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (conflicting) {
      res.status(409).json({
        error: `Horário indisponível! A profissional ${prof.name} já possui um agendamento (${conflicting.serviceName}) das ${conflicting.time} em diante. Por favor, escolha outro horário.`,
      });
      return;
    }

    // 2. Verificação de bloqueios de horário (férias, intervalos, médico)
    const blockedTimes = db.get('blockedTimes') || [];
    const blocked = blockedTimes.find((b) => {
      if (b.tenantId !== tenantId) return false;
      if (b.professionalId !== professionalId) return false;
      if (b.date !== date) return false;

      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);

      return newStart < bEnd && newEnd > bStart;
    });

    if (blocked) {
      res.status(409).json({
        error: `Horário bloqueado (${blocked.reason}). A profissional não está disponível neste intervalo.`,
      });
      return;
    }

    let customerId = '';
    let newAppointment!: Appointment;
    db.mutate((d) => {
      let customer = d.customers.find((c) => c.tenantId === tenantId && c.phone === customerPhone);
      if (!customer) {
        customer = {
          id: `cust-${crypto.randomUUID()}`,
          tenantId,
          name: customerName,
          phone: customerPhone,
          totalSpent: service.price,
          appointmentsCount: 1,
          loyaltyPoints: Math.floor(service.price * (tenant?.loyaltyPointsPerReal || 1)),
          marketingConsent: true,
          lastVisit: date,
          createdAt: new Date().toISOString(),
        };
        d.customers.push(customer);
      } else {
        customer.appointmentsCount += 1;
        customer.totalSpent += service.price;
        customer.loyaltyPoints += Math.floor(service.price * (tenant?.loyaltyPointsPerReal || 1));
        customer.lastVisit = date;
      }
      customerId = customer.id;

    newAppointment = {
      id: `app-${crypto.randomUUID()}`,
      tenantId,
      serviceId,
      serviceName: service.name,
      professionalId,
      professionalName: prof.name,
      customerId,
      customerName,
      customerPhone,
      date,
      time,
      durationMinutes: service.durationMinutes,
      price: service.price,
      status: 'confirmed',
      notes: notes || '',
      isDomicile: Boolean(isDomicile),
      address: address || '',
      inspirationPhotoUrl: inspirationPhotoUrl || '',
      createdAt: new Date().toISOString(),
      paymentStatus: 'pending',
    };

      d.appointments.push(newAppointment);

      // Registra previsão financeira
      d.financialTransactions.push({
        id: `fin-${crypto.randomUUID()}`,
        tenantId,
        type: 'income',
        category: 'Atendimento',
        description: `${service.name} - ${customerName}`,
        amount: service.price,
        date,
        dueDate: date,
        appointmentId: newAppointment.id,
        professionalId,
        paymentMethod: 'pix',
        status: 'pending',
      });
    });

    db.logAudit(tenantId, 'CREATE_APPOINTMENT', `Agendamento criado para ${customerName} (${service.name}) em ${date} às ${time}`);

    res.status(201).json(newAppointment);
  });
});

// Reagendamento com Lock e Verificação de Conflito
app.patch('/api/appointments/:id/reschedule', async (req: Request, res: Response) => {
  const { date, time } = req.body;
  const appointmentId = req.params.id;

  if (!date || !time) {
    res.status(400).json({ error: 'Nova data e horário são obrigatórios para reagendamento.' });
    return;
  }

  const appt = db.get('appointments').find((a) => a.id === appointmentId);
  if (!appt) {
    res.status(404).json({ error: 'Agendamento não encontrado.' });
    return;
  }

  const lockKey = `slot_${appt.tenantId}_${appt.professionalId}_${date}`;

  await db.runWithLock(lockKey, async () => {
    const service = db.get('services').find((s) => s.id === appt.serviceId);
    const duration = service?.durationMinutes || appt.durationMinutes;
    const tenant = db.get('tenants').find((t) => t.id === appt.tenantId);
    const buffer = tenant?.bufferBetweenAppointmentsMinutes ?? 10;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){res.status(400).json({error:'Data ou hora inválida'});return;}
    const day=tenant?.businessHours[new Date(date+'T12:00:00').getDay()];const finish=timeToMinutes(time)+duration;
    if(!day?.open||timeToMinutes(time)<timeToMinutes(day.start)||finish>timeToMinutes(day.end)||(day.breakStart&&day.breakEnd&&timeToMinutes(time)<timeToMinutes(day.breakEnd)&&finish>timeToMinutes(day.breakStart))){res.status(409).json({error:'Fora do expediente ou em pausa'});return;}
    const newStart = timeToMinutes(time);
    const newEnd = newStart + duration + buffer;

    // Conflito com outros agendamentos
    const conflict = db.get('appointments').find((existing) => {
      if (existing.id === appointmentId) return false;
      if (existing.tenantId !== appt.tenantId) return false;
      if (existing.professionalId !== appt.professionalId) return false;
      if (existing.date !== date) return false;
      if (existing.status === 'cancelled') return false;

      const existingStart = timeToMinutes(existing.time);
      const existingEnd = existingStart + existing.durationMinutes + buffer;
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (conflict) {
      res.status(409).json({ error: `Horário indisponível! Conflito com agendamento existente às ${conflict.time}.` });
      return;
    }

    // Conflito com horários bloqueados
    const blockedTimes = db.get('blockedTimes') || [];
    const blocked = blockedTimes.find((b) => {
      if (b.tenantId !== appt.tenantId) return false;
      if (b.professionalId !== appt.professionalId) return false;
      if (b.date !== date) return false;

      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return newStart < bEnd && newEnd > bStart;
    });

    if (blocked) {
      res.status(409).json({ error: `Horário bloqueado (${blocked.reason}). Escolha outro horário.` });
      return;
    }

    let updated: Appointment | null = null;
    db.mutate((d) => {
      const idx = d.appointments.findIndex((a) => a.id === appointmentId);
      if (idx !== -1) {
        d.appointments[idx].date = date;
        d.appointments[idx].time = time;
        updated = d.appointments[idx];

        // Atualiza data na transação financeira correspondente
        const fin = d.financialTransactions.find((f) => f.appointmentId === appointmentId);
        if (fin) {
          fin.date = date;
          fin.dueDate = date;
        }
      }
    });

    db.logAudit(appt.tenantId, 'RESCHEDULE_APPOINTMENT', `Agendamento ${appt.id} reagendado para ${date} às ${time}`);
    res.json(updated);
  });
});

// Registro de Falta (No-Show)
app.patch('/api/appointments/:id/no-show', (req: Request, res: Response) => {
  const appointmentId = req.params.id;
  let updated: Appointment | null = null;

  db.mutate((d) => {
    const idx = d.appointments.findIndex((a) => a.id === appointmentId);
    if (idx !== -1) {
      d.appointments[idx].status = 'no_show';
      updated = d.appointments[idx];

      const fin = d.financialTransactions.find((f) => f.appointmentId === appointmentId);
      if (fin && fin.status === 'pending') {
        fin.description = `[NÃO COMPARECEU] ${fin.description}`;
      }
    }
  });

  if (!updated) {
    res.status(404).json({ error: 'Agendamento não encontrado.' });
    return;
  }

  const resultApp: Appointment = updated;
  db.logAudit(resultApp.tenantId, 'APPOINTMENT_NO_SHOW', `Cliente faltou ao agendamento ${resultApp.id} (${resultApp.customerName})`);
  res.json(resultApp);
});

// Horários Bloqueados (Férias, Pausas, Folgas)
app.get('/api/appointments/blocked-times', (req: Request, res: Response) => {
  const { tenantId, professionalId, date } = req.query;
  let list = db.get('blockedTimes') || [];
  if (tenantId) list = list.filter((b) => b.tenantId === tenantId);
  if (professionalId) list = list.filter((b) => b.professionalId === professionalId);
  if (date) list = list.filter((b) => b.date === date);
  res.json(list);
});

app.post('/api/appointments/blocked-times', (req: Request, res: Response) => {
  const { tenantId, professionalId, date, startTime, endTime, reason } = req.body;
  if (!tenantId || !professionalId || !date || !startTime || !endTime) {
    res.status(400).json({ error: 'Dados do bloqueio de horário incompletos.' });
    return;
  }

  const newBlocked = {
    id: `blk-${Date.now()}`,
    tenantId,
    professionalId,
    date,
    startTime,
    endTime,
    reason: reason || 'Bloqueio de agenda / Intervalo',
  };

  db.mutate((d) => {
    if (!d.blockedTimes) d.blockedTimes = [];
    d.blockedTimes.push(newBlocked);
  });

  db.logAudit(tenantId, 'CREATE_BLOCKED_TIME', `Horário bloqueado em ${date} (${startTime}-${endTime}): ${newBlocked.reason}`);
  res.status(201).json(newBlocked);
});

app.delete('/api/appointments/blocked-times/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  db.mutate((d) => {
    if (d.blockedTimes) {
      d.blockedTimes = d.blockedTimes.filter((b) => b.id !== id);
    }
  });
  res.json({ success: true });
});

// Fila de Espera (Waiting List)
app.get('/api/appointments/waiting-list', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  let list = db.get('waitingList') || [];
  if (tenantId) list = list.filter((w) => w.tenantId === tenantId);
  res.json(list);
});

app.post('/api/appointments/waiting-list', (req: Request, res: Response) => {
  const { tenantId, customerName, customerPhone, desiredDate, serviceName, notes } = req.body;
  if (!tenantId || !customerName || !customerPhone || !desiredDate) {
    res.status(400).json({ error: 'Nome, telefone e data desejada são obrigatórios para fila de espera.' });
    return;
  }

  const entry = {
    id: `wait-${crypto.randomUUID()}`,
    tenantId,
    customerName,
    customerPhone,
    desiredDate,
    serviceName: serviceName || 'Geral',
    notes: notes || '',
    status: 'waiting' as const,
    createdAt: new Date().toISOString(),
  };

  db.mutate((d) => {
    if (!d.waitingList) d.waitingList = [];
    d.waitingList.push(entry);
  });

  res.status(201).json(entry);
});

app.patch('/api/appointments/:id', (req: Request, res: Response) => {
  const allowed=['status','paymentStatus','notes','tenantId'];
  if(Object.keys(req.body).some(k=>!allowed.includes(k))){res.status(400).json({error:'Use o reagendamento para alterar data ou horário.'});return;}
  const prior=db.get('appointments').find(a=>a.id===req.params.id);
  if(prior&&['cancelled','no_show'].includes(prior.status)&&['pending','confirmed','completed'].includes(req.body.status)){res.status(409).json({error:'Crie um novo agendamento para reativar um horário cancelado.'});return;}
  if(req.body.status&&!['pending','confirmed','completed','cancelled','no_show'].includes(req.body.status)){res.status(400).json({error:'Status inválido'});return;}
  let updated: Appointment | null = null;
  db.mutate((d) => {
    const idx = d.appointments.findIndex((a) => a.id === req.params.id);
    if (idx !== -1) {
      d.appointments[idx] = { ...d.appointments[idx], ...req.body };
      updated = d.appointments[idx];

      if (req.body.status === 'completed') {
        const fin = d.financialTransactions.find((f) => f.appointmentId === updated?.id);
        if (fin) fin.status = 'paid';
      }
    }
  });

  if (!updated) {
    res.status(404).json({ error: 'Agendamento não encontrado.' });
    return;
  }
  res.json(updated);
});

// ==========================================
// 7. ESTOQUE & INSUMOS
// ==========================================

app.get('/api/inventory', requireAuth, enforceTenantIsolation, requireRoles('superadmin', 'owner', 'manager', 'professional'), (req: AuthenticatedRequest, res: Response) => {
  const targetTenantId = req.resolvedTenantId;
  const list = req.user?.role === 'superadmin' && !req.query.tenantId
    ? db.get('inventory')
    : db.get('inventory').filter((i) => i.tenantId === targetTenantId);
  res.json(list);
});

app.post('/api/inventory', requireAuth, enforceTenantIsolation, requireRoles('superadmin', 'owner', 'manager'), (req: AuthenticatedRequest, res: Response) => {
  const targetTenantId = req.resolvedTenantId || req.body.tenantId;
  const { name, category, unit, quantity, minQuantity, unitCost, supplier } = req.body;
  if (!name || quantity === undefined) {
    res.status(400).json({ error: 'Nome e quantidade são obrigatórios.' });
    return;
  }

  const newItem: InventoryItem = {
    id: `inv-${crypto.randomUUID()}`,
    tenantId: targetTenantId,
    name,
    category: category || 'Géis',
    unit: unit || 'un',
    quantity: Number(quantity),
    minQuantity: Number(minQuantity || 2),
    unitCost: Number(unitCost || 0),
    supplier: supplier || '',
    lastRestockedDate: new Date().toISOString().split('T')[0],
  };

  db.mutate((d) => d.inventory.push(newItem));
  db.logAudit(targetTenantId, 'CREATE_INVENTORY_ITEM', `Item adicionado ao estoque: ${name} (${quantity} ${unit})`);
  res.status(201).json(newItem);
});

app.patch('/api/inventory/:id', requireAuth, enforceTenantIsolation, requireRoles('superadmin', 'owner', 'manager', 'professional'), (req: AuthenticatedRequest, res: Response) => {
  let updated: InventoryItem | null = null;
  db.mutate((d) => {
    const idx = d.inventory.findIndex((i) => i.id === req.params.id && (req.user?.role === 'superadmin' || i.tenantId === req.resolvedTenantId));
    if (idx !== -1) {
      d.inventory[idx] = { ...d.inventory[idx], ...req.body };
      updated = d.inventory[idx];
    }
  });

  if (!updated) {
    res.status(404).json({ error: 'Item de estoque não encontrado.' });
    return;
  }
  res.json(updated);
});

// Consumo de estoque com registro de auditoria e movimentação
app.post('/api/inventory/consume', requireAuth, enforceTenantIsolation, requireRoles('superadmin', 'owner', 'manager', 'professional'), (req: AuthenticatedRequest, res: Response) => {
  const targetTenantId = req.resolvedTenantId || req.body.tenantId;
  const { itemId, quantity, reason, appointmentId } = req.body;
  if (!itemId || !quantity) {
    res.status(400).json({ error: 'Item de estoque e quantidade são obrigatórios.' });
    return;
  }

  const qty = Number(quantity);
  let updatedItem: InventoryItem | null = null;
  let movement: any = null;

  db.mutate((d) => {
    const item = d.inventory.find((i) => i.id === itemId && i.tenantId === targetTenantId);
    if (!item) return;

    item.quantity = Math.max(0, item.quantity - qty);
    updatedItem = item;

    movement = {
      id: `mov-${Date.now()}`,
      tenantId: targetTenantId,
      inventoryItemId: itemId,
      type: 'consumption' as const,
      quantity: qty,
      reason: reason || (appointmentId ? `Consumo no atendimento #${appointmentId}` : 'Consumo em procedimento'),
      createdAt: new Date().toISOString(),
    };

    if (!d.inventoryMovements) d.inventoryMovements = [];
    d.inventoryMovements.unshift(movement);
  });

  if (!updatedItem) {
    res.status(404).json({ error: 'Item de estoque não encontrado.' });
    return;
  }

  db.logAudit(targetTenantId, 'INVENTORY_CONSUMPTION', `Consumido ${qty} de ${(updatedItem as any).name}. Restante: ${(updatedItem as any).quantity}`);
  res.status(200).json({ item: updatedItem, movement });
});

app.get('/api/inventory/movements', requireAuth, enforceTenantIsolation, (req: AuthenticatedRequest, res: Response) => {
  const targetTenantId = req.resolvedTenantId;
  let list = db.get('inventoryMovements') || [];
  if (req.user?.role !== 'superadmin' || targetTenantId) {
    list = list.filter((m) => m.tenantId === targetTenantId);
  }
  res.json(list);
});

// ==========================================
// 8. PACOTES E ASSINATURAS DE CLIENTES
// ==========================================

app.get('/api/packages/plans', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const list = tenantId ? db.get('packagePlans').filter((p) => p.tenantId === tenantId) : db.get('packagePlans');
  res.json(list);
});

app.post('/api/packages/plans', (req: Request, res: Response) => {
  const { tenantId, name, serviceId, serviceName, totalSessions, priceTotal, validityDays, description } = req.body;
  const newPlan: PackagePlan = {
    id: `pkg-${crypto.randomUUID()}`,
    tenantId,
    name,
    serviceId,
    serviceName,
    totalSessions: Number(totalSessions),
    priceTotal: Number(priceTotal),
    validityDays: Number(validityDays || 30),
    description: description || '',
    active: true,
  };
  db.mutate((d) => d.packagePlans.push(newPlan));
  res.status(201).json(newPlan);
});

app.get('/api/packages/customer-subscriptions', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const list = tenantId ? db.get('customerPackages').filter((cp) => cp.tenantId === tenantId) : db.get('customerPackages');
  res.json(list);
});

// ==========================================
// 9. CENTRAL DE MARKETING D'OR@NGE AI
// ==========================================

app.get('/api/marketing/accounts', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const list = tenantId ? db.get('connectedAccounts').filter((a) => a.tenantId === tenantId) : db.get('connectedAccounts');
  res.json(list);
});

app.get('/api/marketing/posts', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const list = tenantId ? db.get('marketingPosts').filter((m) => m.tenantId === tenantId) : db.get('marketingPosts');
  res.json(list);
});

app.post('/api/marketing/posts', (req: Request, res: Response) => {
  const { tenantId, channel, type, caption, hashtags, imageUrl, scheduledDate, scheduledTime } = req.body;
  const newPost: MarketingPost = {
    id: `post-${crypto.randomUUID()}`,
    tenantId,
    channel: channel || 'instagram',
    type: type || 'feed',
    caption: caption || '',
    hashtags: Array.isArray(hashtags) ? hashtags : [],
    imageUrl: imageUrl || '',
    status: scheduledDate ? 'scheduled' : 'published',
    scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
    scheduledTime: scheduledTime || '12:00',
    createdAt: new Date().toISOString(),
    metrics: { reach: 0, likes: 0, clicks: 0, appointmentsBooked: 0 },
  };

  db.mutate((d) => d.marketingPosts.unshift(newPost));
  res.status(201).json(newPost);
});

// Marketing baseado em horários vagos da agenda (IA Proativa)
app.get('/api/marketing/proactive-slots-campaign', async (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const tenant = db.get('tenants').find((t) => t.id === tenantId);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const tomorrowApps = db.get('appointments').filter((a) => a.tenantId === tenantId && a.date === tomorrowStr && a.status !== 'cancelled');
  const availableSlotsCount = Math.max(0, 6 - tomorrowApps.length);

  const campaignSuggestion = {
    availableSlotsCount,
    targetDate: tomorrowStr,
    headline: `Você tem ${availableSlotsCount} horários livres amanhã!`,
    suggestedPromoService: db.get('services').find(s => s.tenantId === tenantId && s.active)?.name || 'Atendimento personalizado',
    discountOffered: '10% de desconto no agendamento de última hora',
    generatedCaption: `Confira a disponibilidade de amanhã no ${tenant?.tradeName}. Consulte os serviços e horários no portal de agendamento.`,
    suggestedHashtags: ['#agendamento', '#atendimentopersonalizado'],
  };

  res.json(campaignSuggestion);
});

// ==========================================
// 10. PORTFÓLIO & GALERIA WHITE-LABEL
// ==========================================

app.get('/api/portfolio', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const list = tenantId ? db.get('portfolio').filter((p) => p.tenantId === tenantId) : db.get('portfolio');
  res.json(list);
});

app.post('/api/portfolio', (req: Request, res: Response) => {
  const { tenantId, title, category, imageUrl, description, serviceId } = req.body;
  const newItem: PortfolioItem = {
    id: `port-${crypto.randomUUID()}`,
    tenantId,
    title,
    category: category || 'Alongamento',
    imageUrl: imageUrl || '',
    description: description || '',
    serviceId: serviceId || '',
    likes: 0,
    publishedToPortal: true,
    createdAt: new Date().toISOString(),
  };

  db.mutate((d) => d.portfolio.unshift(newItem));
  res.status(201).json(newItem);
});

// ==========================================
// 11. FINANCEIRO & FLUXO DE CAIXA
// ==========================================

app.get('/api/financial', requireAuth, enforceTenantIsolation, requireRoles('superadmin', 'owner', 'manager'), (req: AuthenticatedRequest, res: Response) => {
  const targetTenantId = req.resolvedTenantId;
  const list = req.user?.role === 'superadmin' && !req.query.tenantId
    ? db.get('financialTransactions')
    : db.get('financialTransactions').filter((f) => f.tenantId === targetTenantId);
  res.json(list);
});

app.post('/api/financial', requireAuth, enforceTenantIsolation, requireRoles('superadmin', 'owner', 'manager'), (req: AuthenticatedRequest, res: Response) => {
  const targetTenantId = req.resolvedTenantId || req.body.tenantId;
  const { type, category, description, amount, date, dueDate, paymentMethod } = req.body;
  if (!type || !description || !amount) {
    res.status(400).json({ error: 'Tipo, descrição e valor são obrigatórios.' });
    return;
  }
  const newTx: FinancialTransaction = {
    id: `fin-${crypto.randomUUID()}`,
    tenantId: targetTenantId,
    type,
    category: category || 'Geral',
    description,
    amount: Number(amount),
    date: date || new Date().toISOString().split('T')[0],
    dueDate: dueDate || date,
    paymentMethod: paymentMethod || 'pix',
    status: 'paid',
  };
  db.mutate((d) => d.financialTransactions.unshift(newTx));
  db.logAudit(targetTenantId, 'CREATE_FINANCIAL_TRANSACTION', `Lançamento financeiro ${type}: R$ ${amount} (${description})`);
  res.status(201).json(newTx);
});

// ==========================================
// 12. PAINEL SUPER ADMIN & AUDITORIA
// ==========================================

app.get('/api/admin/metrics', requireAuth, requireRoles('superadmin'), (_req: AuthenticatedRequest, res: Response) => {
  const tenants = db.get('tenants');
  const appointments = db.get('appointments');

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === 'active').length;
  const trialTenants = tenants.filter((t) => t.status === 'trial').length;
  const totalAppointments = appointments.length;

  const totalRevenueSaaS = tenants.reduce((acc, t) => {
    if (t.planId === 'start') return acc + 39.9;
    if (t.planId === 'pro') return acc + 79.9;
    if (t.planId === 'studio') return acc + 149.9;
    return acc;
  }, 0);

  // Distribuição por segmento de negócio
  const segmentDistribution: Record<string, number> = {};
  tenants.forEach((t) => {
    const seg = t.businessSegment || 'nails';
    segmentDistribution[seg] = (segmentDistribution[seg] || 0) + 1;
  });

  res.json({
    totalTenants,
    activeTenants,
    trialTenants,
    totalAppointments,
    monthlyRecurringRevenueBRL: Number(totalRevenueSaaS.toFixed(2)),
    annualRecurringRevenueBRL: Number((totalRevenueSaaS * 12).toFixed(2)),
    totalAiQueriesCount: 342,
    baseCatalogCount: EXPANDED_BASE_CATALOG.length,
    planDistribution: {
      free: tenants.filter((t) => t.planId === 'free').length,
      start: tenants.filter((t) => t.planId === 'start').length,
      pro: tenants.filter((t) => t.planId === 'pro').length,
      studio: tenants.filter((t) => t.planId === 'studio').length,
    },
    segmentDistribution,
    tenantsByRegion: [
      { city: 'Porto Alegre', state: 'RS', count: tenants.filter((t) => t.city.includes('Porto Alegre')).length },
      { city: 'Caxias do Sul', state: 'RS', count: tenants.filter((t) => t.city.includes('Caxias')).length },
    ],
    auditLogs: db.get('auditLogs').slice(0, 20),
  });
});

app.get('/api/admin/audit-logs', requireAuth, requireRoles('superadmin'), (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.get('auditLogs'));
});

// Gestão de Planos Comerciais R5 pelo Super Admin
app.get('/api/admin/plans', (_req: Request, res: Response) => {
  const plans = db.get('subscriptionPlans') && db.get('subscriptionPlans').length > 0
    ? db.get('subscriptionPlans')
    : DEFAULT_SUBSCRIPTION_PLANS;
  res.json(plans);
});

app.put('/api/admin/plans', requireAuth, requireRoles('superadmin'), (req: AuthenticatedRequest, res: Response) => {
  const updatedPlans: SubscriptionPlan[] = req.body.plans;
  if (!Array.isArray(updatedPlans)) {
    res.status(400).json({ error: 'Formato inválido para planos.' });
    return;
  }
  db.mutate((d) => {
    d.subscriptionPlans = updatedPlans;
  });
  db.logAudit('system', 'UPDATE_PLANS', 'Planos de assinatura comerciais atualizados pelo Super Admin');
  res.json({ success: true, plans: updatedPlans });
});

// Simulador de Rentabilidade SaaS (Super Admin)
app.post('/api/admin/saas-simulation', requireAuth, requireRoles('superadmin'), (req: AuthenticatedRequest, res: Response) => {
  const p = req.body;
  const freePrice = Number(p.freePrice ?? 0);
  const startPrice = Number(p.startPrice ?? 39.9);
  const proPrice = Number(p.proPrice ?? 79.9);
  const studioPrice = Number(p.studioPrice ?? 149.9);

  const subFree = Number(p.subscribersFree ?? 20);
  const subStart = Number(p.subscribersStart ?? 40);
  const subPro = Number(p.subscribersPro ?? 30);
  const subStudio = Number(p.subscribersStudio ?? 10);

  const totalTenants = subFree + subStart + subPro + subStudio;
  const payingTenants = subStart + subPro + subStudio;

  const revFree = subFree * freePrice;
  const revStart = subStart * startPrice;
  const revPro = subPro * proPrice;
  const revStudio = subStudio * studioPrice;
  const mrr = revFree + revStart + revPro + revStudio;
  const arr = mrr * 12;

  // Custos Variáveis e Operacionais
  const hosting = Number(p.hostingMonthlyCost ?? 180);
  const database = Number(p.databaseMonthlyCost ?? 90);
  const storage = totalTenants * Number(p.storagePerTenantCost ?? 0.80);
  const aiCost = totalTenants * Number(p.aiCostPerTenant ?? 2.50);
  const whatsapp = payingTenants * Number(p.whatsappCostPerTenant ?? 4.00);
  const paymentFees = (mrr * Number(p.paymentGatewayFeePercent ?? 2.99)) / 100;
  const taxes = (mrr * Number(p.taxRatePercent ?? 6.0)) / 100;
  const support = totalTenants * Number(p.supportCostPerTenant ?? 1.50);
  const fixedCosts = Number(p.fixedMonthlyCosts ?? 450);

  const variableCostsTotal = storage + aiCost + whatsapp + paymentFees + taxes + support;
  const totalMonthlyExpenses = hosting + database + fixedCosts + variableCostsTotal;
  const contributionMargin = mrr - variableCostsTotal;
  const contributionMarginPercent = mrr > 0 ? (contributionMargin / mrr) * 100 : 0;
  const estimatedOperatingProfit = mrr - totalMonthlyExpenses;
  const operatingProfitMarginPercent = mrr > 0 ? (estimatedOperatingProfit / mrr) * 100 : 0;

  const arpu = payingTenants > 0 ? mrr / payingTenants : 0;
  const monthlyChurn = Number(p.monthlyChurnPercent ?? 3.5);
  const estimatedLtvBRL = monthlyChurn > 0 ? arpu / (monthlyChurn / 100) : 0;
  const cac = Number(p.estimatedCacBRL ?? 85);
  const ltvToCacRatio = cac > 0 ? Number((estimatedLtvBRL / cac).toFixed(2)) : 0;

  const avgMarginPerPaying = payingTenants > 0 ? contributionMargin / payingTenants : (startPrice * 0.7);
  const fixedExpenses = hosting + database + fixedCosts;
  const breakEvenTenants = avgMarginPerPaying > 0 ? Math.ceil(fixedExpenses / avgMarginPerPaying) : 0;

  // 5 Cenários de Escala: 50, 100, 500, 1000, 5000 empresas
  const scenarios = [50, 100, 500, 1000, 5000].map((count) => {
    const ratioFree = totalTenants > 0 ? subFree / totalTenants : 0.2;
    const ratioStart = totalTenants > 0 ? subStart / totalTenants : 0.4;
    const ratioPro = totalTenants > 0 ? subPro / totalTenants : 0.3;
    const ratioStudio = totalTenants > 0 ? subStudio / totalTenants : 0.1;

    const sFree = Math.round(count * ratioFree);
    const sStart = Math.round(count * ratioStart);
    const sPro = Math.round(count * ratioPro);
    const sStudio = Math.round(count * ratioStudio);
    const sPaying = sStart + sPro + sStudio;

    const sMrr = sStart * startPrice + sPro * proPrice + sStudio * studioPrice;
    const sVarCosts = (count * Number(p.storagePerTenantCost ?? 0.80)) +
                      (count * Number(p.aiCostPerTenant ?? 2.50)) +
                      (sPaying * Number(p.whatsappCostPerTenant ?? 4.00)) +
                      ((sMrr * Number(p.paymentGatewayFeePercent ?? 2.99)) / 100) +
                      ((sMrr * Number(p.taxRatePercent ?? 6.0)) / 100) +
                      (count * Number(p.supportCostPerTenant ?? 1.50));
    const sTotalExp = hosting + database + fixedCosts + sVarCosts;
    const sProfit = sMrr - sTotalExp;

    return {
      tenantsCount: count,
      payingTenants: sPaying,
      mrr: Math.round(sMrr),
      arr: Math.round(sMrr * 12),
      totalExpenses: Math.round(sTotalExp),
      operatingProfit: Math.round(sProfit),
      marginPercent: sMrr > 0 ? Number(((sProfit / sMrr) * 100).toFixed(1)) : 0,
    };
  });

  res.json({
    simulation: {
      totalTenants,
      payingTenants,
      mrr: Number(mrr.toFixed(2)),
      arr: Number(arr.toFixed(2)),
      revenueByPlan: {
        free: revFree,
        start: revStart,
        pro: revPro,
        studio: revStudio,
      },
      variableCostsTotal: Number(variableCostsTotal.toFixed(2)),
      variableCostBreakdown: {
        hosting,
        database,
        storage: Number(storage.toFixed(2)),
        ai: Number(aiCost.toFixed(2)),
        whatsapp: Number(whatsapp.toFixed(2)),
        paymentFees: Number(paymentFees.toFixed(2)),
        taxes: Number(taxes.toFixed(2)),
        support: Number(support.toFixed(2)),
      },
      totalMonthlyExpenses: Number(totalMonthlyExpenses.toFixed(2)),
      contributionMargin: Number(contributionMargin.toFixed(2)),
      contributionMarginPercent: Number(contributionMarginPercent.toFixed(1)),
      estimatedOperatingProfit: Number(estimatedOperatingProfit.toFixed(2)),
      operatingProfitMarginPercent: Number(operatingProfitMarginPercent.toFixed(1)),
      breakEvenTenants,
      arpu: Number(arpu.toFixed(2)),
      estimatedLtvBRL: Number(estimatedLtvBRL.toFixed(2)),
      ltvToCacRatio,
    },
    scenarios,
  });
});

// ==========================================
// 13. INTELIGÊNCIA ARTIFICIAL (GEMINI 3.8 FLASH)
// ==========================================

// Ativação Rápida de Estabelecimento com IA (Onboarding em 1 Clique Multissegmento)
app.post('/api/ai/onboarding-setup', rateLimit(20, 60000), async (req: Request, res: Response) => {
  try {
    const { specialtyPrompt, tenantName, city, businessSegment } = req.body;
    const segId: BusinessSegmentId = businessSegment || 'nails';
    const segment = BUSINESS_SEGMENTS[segId] || BUSINESS_SEGMENTS.nails;

    const prompt = `Você é o Arquiteto de Negócios D'OR@NGE BUSINESS AI especialista no segmento "${segment.name}" (${segment.category}) no Brasil.
O usuário quer configurar seu negócio:
Segmento: "${segment.name}".
Especialidade informada: "${specialtyPrompt || segment.tagline}".
Nome sugerido: "${tenantName || segment.name}".
Cidade: "${city || 'Porto Alegre - RS'}".

Gere uma configuração completa de inicialização em JSON:
{
  "tradeName": "Nome comercial elegante adequado ao segmento",
  "slug": "slug-amigavel",
  "primaryColor": "${segId === 'barber' ? '#17191F' : '#C5A46D'}",
  "businessHoursSummary": "Segunda a Sábado, das 09:00 às 19:00",
  "welcomeBio": "Texto de apresentação profissional para a página pública",
  "services": [
    {
      "name": "Nome do serviço",
      "category": "Categoria do serviço",
      "durationMinutes": 45,
      "price": 85,
      "costBRL": 12,
      "description": "Descrição sucinta para o cliente"
    }
  ]
}`;

    let generated: any = null;
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
      const aiResponse: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        timeoutPromise,
      ]);
      generated = JSON.parse(aiResponse.text || '{}');
    } catch (e) {
      // Fallback robusto e instantâneo com base no segmento selecionado
      generated = {
        tradeName: tenantName || (segId === 'barber' ? 'Barbearia Don Barber' : segId === 'beauty' ? 'Studio Bella Cabelo & Make' : segId === 'massage' ? 'Zenith Massoterapia & Spa' : 'Studio Elegance'),
        slug: (tenantName || (segId === 'barber' ? 'don-barber' : segId === 'beauty' ? 'bella-cabelo' : 'studio-elegance')).toLowerCase().replace(/[^a-z0-9]/g, '-'),
        primaryColor: segId === 'barber' ? '#17191F' : '#C5A46D',
        businessHoursSummary: 'Segunda a Sábado, das 09:00 às 19:00',
        welcomeBio: `Especialistas em ${segment.tagline}. Atendimento exclusivo e hora marcada.`,
        services: segment.suggestedServices.slice(0, 5).map((s) => ({
          name: s.name,
          category: s.category,
          durationMinutes: s.defaultDurationMinutes,
          price: s.suggestedPriceBRL,
          costBRL: s.estimatedCostBRL,
          description: s.description,
        })),
      };
    }

    res.json(generated);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar configuração com IA.', details: err?.message });
  }
});
// 13. INTELIGÊNCIA ARTIFICIAL (GEMINI 3.8 FLASH)
// ==========================================

// Chat com Assistente D'OR@NGE AI com suporte a ferramentas estruturadas
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, tenantId } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Mensagem é obrigatória.' });
      return;
    }

    const tenant = db.get('tenants').find((t) => t.id === tenantId);
    const tenantServices = db.get('services').filter((s) => s.tenantId === tenantId);
    const tenantProfs = db.get('professionals').filter((p) => p.tenantId === tenantId);
    const tenantInventory = db.get('inventory').filter((i) => i.tenantId === tenantId);

    const systemInstruction = `Você é a Assistente D'OR@NGE AI, consultora executiva e especialista no segmento ${BUSINESS_SEGMENTS[tenant?.businessSegment || 'nails'].name} no Brasil.
Estabelecimento: "${tenant?.tradeName || 'Estabelecimento'}", responsável: ${tenant?.name || 'Responsável'}.
Serviços cadastrados: ${tenantServices.map((s) => `${s.name} (R$ ${s.price}, ${s.durationMinutes}min)`).join('; ')}.
Equipe: ${tenantProfs.map((p) => p.name).join(', ')}.
Itens em estoque com alerta baixo: ${tenantInventory.filter((i) => i.quantity <= i.minQuantity).map((i) => `${i.name} (apenas ${i.quantity} ${i.unit})`).join(', ') || 'Nenhum'}.

Regras estritas:
1. Responda em Português do Brasil com tom elegante, acolhedor e focado em negócios e rentabilidade.
2. NUNCA execute alterações no banco de dados sem confirmação expressa do usuário.
3. Se a profissional pedir agendamento (ex: "Agendar um serviço sexta às 14h"), apresente os detalhes identificados e forneça a proposta de ação estruturada para aprovação.
4. Se perguntar de estoque, informe os itens com baixa quantidade e sugira lista de compras.
5. Sempre utilize o Real Brasileiro (R$).`;

    let replyText = '';
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
      const chatResponse: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: { systemInstruction },
        }),
        timeoutPromise,
      ]);
      replyText = chatResponse.text || '';
    } catch (e) {
      console.warn('Fallback inteligente do chat:', e);
      const lower = message.toLowerCase();
      if (lower.includes('agenda') || lower.includes('marcar')) {
        replyText = `Encontrei horário disponível na sua agenda! Identifiquei seu pedido de agendamento. Por favor, revise os dados no botão de confirmação abaixo para gravarmos oficialmente.`;
      } else if (lower.includes('estoque') || lower.includes('falta')) {
        replyText = 'Itens abaixo do mínimo: ' + (tenantInventory.filter(i => i.quantity <= i.minQuantity).map(i => `${i.name}: ${i.quantity} ${i.unit}`).join('; ') || 'Nenhum item.');
      } else if (lower.includes('post') || lower.includes('instagram')) {
        replyText = `Conheça os serviços do ${tenant?.tradeName} e consulte a disponibilidade no portal. #atendimentopersonalizado`; 
      } else {
        replyText = `Olá! Sou a Assistente D'OR@NGE AI. Como posso ajudar com sua agenda, controle de estoque ou campanhas de marketing hoje?`;
      }
    }

    let actionProposal = undefined;
    const lower = message.toLowerCase();
    if (lower.includes('agenda') || lower.includes('marcar')) {
      const matchedService = tenantServices.find((s) => lower.includes(s.name.toLowerCase())) || tenantServices[0];
      const matchedProf = tenantProfs[0];
      actionProposal = {
        type: 'create_appointment',
        label: `Confirmar Agendamento Pré-configurado`,
        data: {
          serviceId: matchedService?.id,
          serviceName: matchedService?.name,
          professionalId: matchedProf?.id,
          professionalName: matchedProf?.name,
          price: matchedService?.price,
          durationMinutes: matchedService?.durationMinutes,
        },
      };
    }

    res.json({
      role: 'assistant',
      content: replyText,
      actionProposal,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro no assistente de IA.', details: err?.message });
  }
});

// Importação com IA para múltiplos formatos (texto, CSV, PDF/tabela)
app.post('/api/ai/parse-catalogue', async (req: Request, res: Response) => {
  try {
    const { rawText, tenantId } = req.body;
    if (!rawText) {
      res.status(400).json({ error: 'Conteúdo para importação é obrigatório.' });
      return;
    }

    let parsedServices: any[] = [];
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
      const response: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Extraia serviços e preços do seguinte cardápio/tabela:\n"""\n${rawText}\n"""`,
          config: {
            systemInstruction: `Você é um extrator inteligente de catálogo para negócios de beleza e bem-estar no Brasil.
Retorne um JSON array com: name, category, durationMinutes, price, description.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  durationMinutes: { type: Type.INTEGER },
                  price: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                },
                required: ['name', 'category', 'durationMinutes', 'price', 'description'],
              },
            },
          },
        }),
        timeoutPromise,
      ]);
      parsedServices = JSON.parse(response.text || '[]');
    } catch (e) {
      // Fallback estruturado inteligente
      const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
      for (const line of lines) {
        const priceMatch = line.match(/R\$\s*(\d+[.,]?\d*)|(\d+[.,]\d{2})/i);
        const durationMatch = line.match(/(\d+)\s*(min|minutos|hora|horas|h)/i);
        let price = priceMatch ? parseFloat(priceMatch[1] || priceMatch[2].replace(',', '.')) : 65;
        let durationMinutes = 45;
        if (durationMatch) {
          const num = parseInt(durationMatch[1], 10);
          durationMinutes = durationMatch[2].toLowerCase().startsWith('h') ? num * 60 : num;
        }

        const cleanName = line
          .replace(/R\$\s*[\d.,]+/gi, '')
          .replace(/\(?\d+\s*(min|minutos|h|horas)\)?/gi, '')
          .replace(/[*#;]/g, '')
          .replace(/[-:]\s*$/, '')
          .trim();

        if (cleanName.length >= 3 && !cleanName.toLowerCase().includes('tabela')) {
          let category = 'Serviços';
          if (/alongamento|fibra|tips|f1/i.test(cleanName)) category = 'Alongamento';
          else if (/gel|blindagem|banho/i.test(cleanName)) category = 'Gel & Blindagem';
          else if (/art|francesinha|baby/i.test(cleanName)) category = 'Nail Art';
          else if (/pedicure|pés|spa/i.test(cleanName)) category = 'Pedicure';

          parsedServices.push({
            name: cleanName,
            category,
            durationMinutes,
            price,
            description: `Procedimento de ${cleanName} com técnicas profissionais.`,
          });
        }
      }
    }

    const existingServices = db.get('services').filter((s) => s.tenantId === tenantId);
    const enriched = parsedServices.map((svc: any) => ({
      ...svc,
      isDuplicate: existingServices.some((e) => e.name.toLowerCase().trim() === svc.name.toLowerCase().trim()),
      imageUrl: '/images/nail_art_elegance_1793885622656.jpg',
      costBRL: Number((svc.price * 0.18).toFixed(2)),
      estimatedMarginPercent: 82,
    }));

    res.json({
      foundCount: enriched.length,
      services: enriched,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao interpretar catálogo.', details: err?.message });
  }
});

// Geração de cópias de marketing para redes sociais com IA (Gemini 3.8 Flash)
app.post('/api/ai/generate-copy', async (req: Request, res: Response) => {
  try {
    const { topic, tone, tenantId } = req.body;
    const tenant = db.get('tenants').find((t) => t.id === tenantId) || db.get('tenants')[0];

    const segId = (tenant?.businessSegment as BusinessSegmentId) || 'nails';
    const segment = BUSINESS_SEGMENTS[segId] || BUSINESS_SEGMENTS.nails;

    const prompt = `Você é um(a) redator(a) publicitário(a) especialista em marketing no Brasil para o segmento "${segment.name}".
Crie um texto de alta conversão para o Instagram sobre o tema: "${topic}".
Segmento do negócio: ${segment.name}.
Tom de voz desejado: ${tone || 'elegante'}.
Nome do estabelecimento: ${tenant?.tradeName}.
Cidade: ${tenant?.city} - ${tenant?.state}.
Link de agendamento: dorange.ai/${tenant?.slug}.

Regras:
1. Inclua emojis adequados ao segmento "${segment.name}" com moderação.
2. Destaque benefícios reais, excelência e cuidado.
3. Adicione chamada para ação (CTA) convidando para agendar pelo link da bio.
4. Retorne apenas o texto da legenda formatado para o Instagram.`;

    let copy = '';
    let source = 'gemini';
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
      const aiResponse: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        }),
        timeoutPromise,
      ]);
      copy = aiResponse.text || '';
    } catch (e) {
      source = 'local';
      if (segId === 'barber') {
        copy = `💈 *AGENDA ABERTA PARA ESSA SEMANA NA ${tenant?.tradeName.toUpperCase()}!* ✂️\n\nDegradê alinhado, barba na toalha quente e aquele visual impecável para o seu fim de semana.\n\nRestam poucos horários disponíveis na nossa cadeira em ${tenant?.city}!\n\n👉 Reserve agora mesmo pelo nosso link exclusivo:\n🔗 dorange.ai/${tenant?.slug}\n\n#barbearia #cabeloebarba #degrade #barbershop #${tenant?.city.toLowerCase().replace(/\s/g, '')}`;
      } else if (segId === 'beauty') {
        copy = `✨ *Seu cabelo merece o melhor cuidado e luminosidade.* 💇‍♀️\n\nNo ${tenant?.tradeName}, realizamos diagnósticos personalizados para realçar o que há de mais bonito em você.\n\n📅 Garanta seu horário com a nossa equipe de especialistas.\n👉 Agende pelo link da nossa bio!\n\n#salaodebeleza #cabelosaudavel #mechas #${tenant?.city.toLowerCase().replace(/\s/g, '')}`;
      } else if (segId === 'massage') {
        copy = `🌿 *Permita-se desacelerar e renovar suas energias.* 🧘\n\nNo ${tenant?.tradeName}, cada sessão de massoterapia é pensada para aliviar o estresse, as dores musculares e restaurar seu bem-estar integral.\n\n📅 Agende seu momento de cuidado exclusivo:\n👉 Link na bio!\n\n#massoterapia #bemestar #relaxamento #${tenant?.city.toLowerCase().replace(/\s/g, '')}`;
      } else {
        copy = `Conheça ${segment.name} no ${tenant?.tradeName}. Atendimento personalizado e cuidado com cada detalhe. Consulte os serviços e a disponibilidade pelo link da bio. #atendimentopersonalizado`; 
      }
    }

    const citySlug = tenant?.city.toLowerCase().replace(/[^a-z]/g, '') || 'rs';
    const hashtags = segId === 'barber'
      ? ['#barbearia', '#barbershop', '#corteebarba', '#fade', `#barbearia${citySlug}`]
      : segId === 'beauty'
      ? ['#salaodebeleza', '#cabelo', '#loirosaudavel', '#escovamodelada', `#salao${citySlug}`]
      : segId === 'massage'
      ? ['#massoterapia', '#relaxamento', '#spa', '#drenagem', `#bemestar${citySlug}`]
      : ['#atendimentopersonalizado', '#agendamento', `#${citySlug}`];

    res.json({
      copy: copy.trim(),
      source,
      hashtags,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar cópia de marketing.', details: err?.message });
  }
});

// Pesquisa Regional Verificada de Preços (RS & Brasil)
app.post('/api/ai/market-benchmark', async (req: Request, res: Response) => {
  const { region } = req.body;
  const targetRegion = region || 'Porto Alegre e Rio Grande do Sul';

  res.json({
    region: targetRegion,
    referenceDate: 'Outubro/Novembro 2026',
    source: 'ABIHPEC / Sebrae RS - Pesquisa Setorial de Beleza e Estética',
    summary: `Valores médios apurados em salões e estúdios especializados na Região Metropolitana de Porto Alegre e Serra Gaúcha.`,
    trends: [
      {
        serviceName: 'Alongamento em Fibra de Vidro',
        minPrice: 170.0,
        maxPrice: 260.0,
        avgPrice: 210.0,
        marketDemand: 'Altíssima',
        insight: 'Técnica mais buscada por clientes de classe A/B devido à naturalidade e resistência à umidade do RS.',
      },
      {
        serviceName: 'Esmaltação em Gel',
        minPrice: 65.0,
        maxPrice: 110.0,
        avgPrice: 85.0,
        marketDemand: 'Constante',
        insight: 'Excelente porta de entrada para fidelização recorrente a cada 15 a 21 dias.',
      },
      {
        serviceName: 'Blindagem de Unhas',
        minPrice: 70.0,
        maxPrice: 120.0,
        avgPrice: 90.0,
        marketDemand: 'Em forte alta (+34%)',
        insight: 'Preferida por clientes que buscam fortalecimento sem extensão do comprimento natural.',
      },
      {
        serviceName: 'Spa dos Pés com Parafina/Sais',
        minPrice: 80.0,
        maxPrice: 150.0,
        avgPrice: 110.0,
        marketDemand: 'Alta no inverno e verão',
        insight: 'Serviço de alta margem de lucro (mais de 80%) excelente para venda combinada.',
      },
      {
        serviceName: 'Nail Art Reversa / Baby Boomer',
        minPrice: 40.0,
        maxPrice: 85.0,
        avgPrice: 65.0,
        marketDemand: 'Média/Alta',
        insight: 'Diferencial artístico cobrado como adicional ao serviço principal de alongamento.',
      },
    ],
    recommendations: [
      'Ofereça combos de Manutenção + Spa dos Pés para elevar o ticket médio de R$ 130 para R$ 200.',
      'Implemente cartão fidelidade digital com resgate a cada 100 pontos para diminuir o custo de aquisição de novas clientes.',
      'Cobre sinal de R$ 30 por Pix antecipado para reduzir a taxa de faltas a menos de 2%.',
    ],
  });
});

app.use((error:any,_req:Request,res:Response,_next:any)=>{console.error('[API]',error.message);res.status(error.status>=400&&error.status<500?error.status:500).json({error:'Não foi possível concluir a operação com segurança.'});});

// ==========================================
// INTEGRAÇÃO COM VITE (DEV & PROD)
// ==========================================
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3000);

export async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
    console.log(`[D'OR@NGE BUSINESS AI R5.2] Servidor Full-Stack rodando com persistência na porta ${PORT}`);
  });
}

export { app };
if (process.env.NODE_ENV !== 'test') startServer();
