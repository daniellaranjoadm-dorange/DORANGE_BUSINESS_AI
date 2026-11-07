import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db } from './db.js';
import { AuthenticatedRequest, requireAuth, requireRoles, rateLimit } from './auth.js';
const grants = new Map<string, {tenantId:string; expires:number}>();
export function issueOnboarding(req: Request,res: Response) {
  const token = crypto.randomBytes(32).toString('hex');
  for(const [key,g] of grants) if(g.expires<Date.now()) grants.delete(key);
  if(grants.size>=1000) {res.status(429).json({error:'Tente novamente mais tarde.'});return;}
  const grant={tenantId:`tenant-${crypto.randomUUID()}`, expires:Date.now()+30*60*1000};
  grants.set(token,grant);res.json({token,expiresAt:grant.expires});
}
export function onboardingGrant(req: Request) { const token=String(req.headers['x-onboarding-token']||'');const g=grants.get(token);return g && g.expires>Date.now()?g:null; }
export function consumeGrant(req: Request) { grants.delete(String(req.headers['x-onboarding-token']||'')); }
const collections: Record<string,string>={resources:'physicalResources',services:'services',professionals:'professionals',customers:'customers',appointments:'appointments',inventory:'inventory',portfolio:'portfolio',financial:'financialTransactions'};
export function isAllowedOrigin(origin: string | undefined, req: Request): boolean {
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host.toLowerCase();
    const originHostname = originUrl.hostname.toLowerCase();

    // 1. Host local da requisição atual ou cabeçalho x-forwarded-host
    const hostHeader = (req.get('host') || '').toLowerCase();
    const forwardedHost = (req.headers['x-forwarded-host'] as string || '').toLowerCase().split(',')[0].trim();
    if (originHost === hostHeader || (forwardedHost && originHost === forwardedHost)) {
      return true;
    }
    const hostNameOnly = hostHeader.split(':')[0];
    const forwardedNameOnly = forwardedHost.split(':')[0];
    if (originHostname === hostNameOnly || (forwardedNameOnly && originHostname === forwardedNameOnly)) {
      return true;
    }

    // 2. Loopback e desenvolvimento local
    if (originHostname === 'localhost' || originHostname === '127.0.0.1') {
      return true;
    }

    // 3. Domínios confiáveis do Google AI Studio & Cloud Run
    if (
      originHostname.endsWith('.run.app') ||
      originHostname.endsWith('.google.com') ||
      originHostname === 'aistudio.google.com'
    ) {
      return true;
    }

    // 4. Domínios configurados via ambiente
    if (process.env.APP_URL) {
      try {
        const appHost = new URL(process.env.APP_URL).host.toLowerCase();
        if (originHost === appHost || originHostname === appHost.split(':')[0]) return true;
      } catch {}
    }
    if (process.env.ALLOWED_ORIGINS) {
      const list = process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim().toLowerCase());
      if (list.includes(originHost) || list.includes(originHostname) || list.includes(origin.toLowerCase())) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function privateGate(req: AuthenticatedRequest,res:Response,next:NextFunction) {
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  const origin=req.headers.origin;
  if(!['GET','HEAD','OPTIONS'].includes(req.method) && origin) {
    if (!isAllowedOrigin(origin, req)) {
      db.logAudit('system', 'ORIGIN_REJECTED', `Origem não autorizada bloqueada: ${origin}`, undefined, 'anonymous');
      res.status(403).json({error:'Origem não autorizada'});
      return;
    }
  }
  const publicRoute=(req.method==='POST' && ['/auth/login','/auth/recover-password','/onboarding/session','/tenants','/appointments'].includes(req.path)) || (req.method==='GET' && (/^\/public\//.test(req.path)||/^\/business-segments(?:\/[^/]+)?$/.test(req.path)||req.path==='/base-catalog'||req.path==='/plans'));
  if(publicRoute) {next();return;}
  if((req.path.startsWith('/upload') || req.path==='/ai/onboarding-setup') && onboardingGrant(req)) {next();return;}
  requireAuth(req,res,()=>{
    const user=req.user!;
    if(req.path.startsWith('/admin/')) {requireRoles('superadmin')(req,res,next);return;}
    if(req.path.startsWith('/auth/')) {next();return;}
    if(!['owner','manager','professional','superadmin'].includes(user.role)) {res.status(403).json({error:'Perfil sem acesso ao painel'});return;}
    const explicit=[req.query.tenantId,req.body?.tenantId].filter(Boolean);
    const parts=req.path.split('/').filter(Boolean);const table=collections[parts[0]];
    let target:string|undefined;
    if(parts[0]==='tenants' && parts[1]) {const t=db.get('tenants').find(t=>t.id===parts[1]||t.slug===parts[1]);if(!t){res.status(404).json({error:'Empresa inexistente'});return;}target=t.id;}
    else if(table && parts[1] && !['blocked-times','waiting-list','consume','movements'].includes(parts[1])) {
      const row=(db.get(table as any) as any[])?.find(x=>x.id===parts[1]);
      if(!row) {res.status(404).json({error:'Recurso não encontrado'});return;} target=row.tenantId;
    } else if(parts[0]==='appointments' && parts[2]) {
      const tableName=parts[1]==='blocked-times'?'blockedTimes':'waitingList';
      const row=(db.get(tableName) as any[]).find(x=>x.id===parts[2]);
      if(!row){res.status(404).json({error:'Recurso não encontrado'});return;}target=row.tenantId;
    }
    if(user.role!=='superadmin' && (!user.tenantId||[...explicit,target].filter(Boolean).some(t=>t!==user.tenantId))) {res.status(403).json({error:'Empresa não autorizada'});return;}
    const tenant=target||String(req.query.tenantId||req.body?.tenantId||user.tenantId||'');
    if(tenant && !db.get('tenants').some(t=>t.id===tenant)){res.status(403).json({error:'Empresa inexistente'});return;}
    req.resolvedTenantId=tenant;
    if(tenant){req.query.tenantId=tenant;req.body={...req.body,tenantId:tenant};}
    if(!['GET','HEAD'].includes(req.method) && user.role==='professional' && !['/appointments','/inventory'].some(p=>req.path.startsWith(p))) {res.status(403).json({error:'Permissão insuficiente'});return;}
    if(parts[0]==='tenants' && req.method!=='GET' && !['owner','superadmin'].includes(user.role)){res.status(403).json({error:'Somente o proprietário pode alterar a empresa'});return;}
    // Validate every supplied foreign key against the authorized tenant.
    for(const [key,collection] of Object.entries({serviceId:'services',professionalId:'professionals',customerId:'customers',itemId:'inventory',inventoryItemId:'inventory',resourceId:'physicalResources',appointmentId:'appointments',packagePlanId:'packagePlans'})) {
      const id=req.body?.[key];if(id && !(db.get(collection as any) as any[])?.some(x=>x.id===id&&x.tenantId===tenant)){res.status(403).json({error:`Referência não autorizada: ${key}`});return;}
    }
    for(const [key,collection] of Object.entries({professionalIds:'professionals',services:'services'})) {
      const ids=req.body?.[key];if(Array.isArray(ids)&&ids.some(id=>!(db.get(collection as any) as any[]).some(x=>x.id===id&&x.tenantId===tenant))){res.status(403).json({error:`Referência não autorizada: ${key}`});return;}
    }
    for(const key of ['imageUrl','logoUrl','coverUrl','inspirationPhotoUrl']) {
      const value=req.body?.[key];
      if(value && (typeof value!=='string' || !(value.startsWith('/images/')&&!value.includes('..') || value.startsWith('/api/uploads/'+tenant+'/')&&!value.includes('..') || /^https:\/\//.test(value)))) {res.status(400).json({error:'Referência de imagem inválida'});return;}
    }
    if(req.method!=='GET' && req.body){ delete req.body.id; if(parts[0]!=='tenants'){delete req.body.role;delete req.body.passwordHash;} }
    next();
  });
}
export const onboardingLimit = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }
  return rateLimit(100, 60 * 60 * 1000)(req, res, next);
};
export function publicTenant(t:any) { const keys=['id','slug','tradeName','city','state','address','phone','whatsapp','serviceType','businessSegment','description','logoUrl','coverUrl','primaryColor','secondaryColor','instagram','businessHours','bufferBetweenAppointmentsMinutes','loyaltyProgramEnabled','loyaltyPointsPerReal'];return Object.fromEntries(keys.map(k=>[k,t[k]])); }
export function publicBooking(req:Request,res:Response) {
  const t=db.get('tenants').find(t=>t.slug===req.params.slug && ['active','trial'].includes(t.status));
  if(!t){res.status(404).json({error:'Estabelecimento não encontrado'});return;}
  const services=db.get('services').filter(s=>s.tenantId===t.id&&s.active).map(({id,name,category,description,durationMinutes,price,imageUrl,professionalIds,active})=>({id,name,category,description,durationMinutes,price,imageUrl,professionalIds,active}));
  const professionals=db.get('professionals').filter(p=>p.tenantId===t.id&&p.active).map(({id,name,role,services,schedule,avatarUrl})=>({id,name,role,services,schedule,avatarUrl}));
  const appointments=db.get('appointments').filter(a=>a.tenantId===t.id&&a.date===req.query.date&&a.status!=='cancelled').map(({time,durationMinutes,professionalId})=>({time,durationMinutes,professionalId}));
  const portfolio=db.get('portfolio').filter(p=>p.tenantId===t.id&&p.publishedToPortal).map(({id,title,category,imageUrl,description})=>({id,title,category,imageUrl,description}));
  res.json({tenant:publicTenant(t),services,professionals,appointments,portfolio});
}
