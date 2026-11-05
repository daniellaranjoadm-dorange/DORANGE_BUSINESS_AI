import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { UserAccount, UserRole } from '../src/types/index.js';
import crypto from 'crypto';

export interface AuthenticatedRequest extends Request {
  user?: UserAccount;
  resolvedTenantId?: string;
}

// Armazenamento em memória de sessões ativas sincronizado com os usuários
const activeSessions: Map<string, { userId: string; createdAt: number; expiresAt: number }> = new Map();

// Inicializa sessões padrão para os usuários de desenvolvimento
export function initializeSessions(): void { /* No implicit development sessions. */ }

// Cria uma nova sessão segura para um usuário
export function createSession(user: UserAccount): string {
  for(const [token,session] of activeSessions)if(session.expiresAt<Date.now())activeSessions.delete(token);
  const random = crypto.randomBytes(24).toString('hex');
  const token = `sess_${user.id}_${Date.now()}_${random}`;
  activeSessions.set(token, {
    userId: user.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  });
  return token;
}

// Revoga uma sessão (Logout)
export function revokeSession(token: string): boolean { return activeSessions.delete(token); }
export function revokeUserSessions(userId: string): void { for (const [token, session] of activeSessions) if (session.userId === userId) activeSessions.delete(token); }
export function expireSessionForTest(token: string): void { if (process.env.NODE_ENV === 'test') { const s = activeSessions.get(token); if (s) s.expiresAt = 0; } }
export function safeUser(user: UserAccount) { const { password, passwordHash, ...safe } = user; return safe; }
export function setSessionCookie(res: Response, token: string) { res.cookie('dorange_session', token, { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === 'true', maxAge: 8 * 60 * 60 * 1000, path: '/' }); }


// Helper para obter usuário por token
export function getUserByToken(token: string): UserAccount | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  const user = db.get('users').find((u) => u.id === session.userId);
  if(user && user.role!=='superadmin' && !db.get('tenants').some(t=>t.id===user.tenantId&&['active','trial'].includes(t.status)))return null;
  return user || null;
}

/**
 * Middleware de Autenticação Obrigatória
 * Verifica token Bearer no cabeçalho Authorization ou x-session-token
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-session-token'] as string;
  const cookieToken = (req.headers.cookie || '').split(';').find(c => c.trim().startsWith('dorange_session='))?.trim().slice(16) || ''; 

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (customHeader) {
    token = customHeader.trim();
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) {
    res.status(401).json({
      error: 'Autenticação necessária',
      code: 'UNAUTHENTICATED',
      message: 'Token de sessão ausente ou inválido. Faça login para continuar.',
    });
    return;
  }

  const user = getUserByToken(token);
  if (!user) {
    res.status(401).json({
      error: 'Sessão expirada ou inválida',
      code: 'INVALID_SESSION',
      message: 'Sua sessão é inválida ou expirou. Por favor, acesse novamente.',
    });
    return;
  }

  req.user = user;
  next();
}

/**
 * Middleware de Identificação Opcional (para rotas híbridas públicas/privadas)
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-session-token'] as string;
  const cookieToken = (req.headers.cookie || '').split(';').find(c => c.trim().startsWith('dorange_session='))?.trim().slice(16) || ''; 

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (customHeader) {
    token = customHeader.trim();
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (token) {
    const user = getUserByToken(token);
    if (user) req.user = user;
  }
  next();
}

/**
 * Middleware de Isolamento Multi-Tenant Estrito
 * Garante que usuários só acessem dados do tenant ao qual pertencem.
 * O tenant é resolvido pela sessão autenticada do usuário, NUNCA confiando cegamente no body/query.
 */
export function enforceTenantIsolation(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Usuário não autenticado', code: 'UNAUTHENTICATED' });
    return;
  }

  // Super Admin pode acessar qualquer tenant ou o sistema global
  if (user.role === 'superadmin') {
    const requestedTenant = (req.params.tenantId || (req.path.startsWith('/tenants/') ? req.params.id : undefined) || req.query.tenantId || req.body?.tenantId) as string;
    req.resolvedTenantId = requestedTenant || user.tenantId || 'tenant-1';
    next();
    return;
  }

  // Se o usuário não tiver tenantId associado (ex: cliente sem vínculo direto)
  if (!user.tenantId) {
    res.status(403).json({
      error: 'Acesso negado',
      code: 'TENANT_NOT_ASSOCIATED',
      message: 'Usuário não vinculado a nenhum estabelecimento comercial.',
    });
    return;
  }

  // Verifica se o usuário está tentando acessar explicitamente dados de OUTRO tenant
  const requestedTenant = (req.params.tenantId || (req.path.startsWith('/tenants/') ? req.params.id : undefined) || req.query.tenantId || req.body?.tenantId) as string;
  if (requestedTenant && requestedTenant !== user.tenantId) {
    db.logAudit(
      user.tenantId,
      'CROSS_TENANT_VIOLATION_BLOCKED',
      `Usuário ${user.email} (${user.role}) tentou acessar dados do tenant ${requestedTenant}`,
      user.id,
      user.role
    );

    res.status(403).json({
      error: 'Acesso negado',
      code: 'CROSS_TENANT_FORBIDDEN',
      message: 'Tentativa de acesso a dados de outro salão foi bloqueada por razões de segurança e LGPD.',
    });
    return;
  }

  // O tenant autorizado é sempre o tenant do usuário na sessão!
  req.resolvedTenantId = user.tenantId;
  next();
}

/**
 * Middleware RBAC: Valida papéis permitidos para uma operação
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Usuário não autenticado', code: 'UNAUTHENTICATED' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      db.logAudit(
        user.tenantId || 'system',
        'UNAUTHORIZED_ROLE_ACCESS',
        `Acesso negado à rota ${req.method} ${req.path}. Papel requerido: [${allowedRoles.join(', ')}]. Papel do usuário: ${user.role}`,
        user.id,
        user.role
      );

      res.status(403).json({
        error: 'Permissão insuficiente',
        code: 'FORBIDDEN_ROLE',
        message: `Esta ação requer privilégios de [${allowedRoles.join(', ')}]. Seu perfil atual é '${user.role}'.`,
      });
      return;
    }

    next();
  };
}

/**
 * Rate Limiter simples em memória por IP / Tenant
 */
const rateLimitMap: Map<string, { count: number; resetAt: number }> = new Map();

export function rateLimit(limit: number = 60, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${ip}_${req.baseUrl}${req.path}`;
    const now = Date.now();

    for (const [entryKey, entry] of rateLimitMap) if (entry.resetAt <= now) rateLimitMap.delete(entryKey);
    if (!rateLimitMap.has(key) && rateLimitMap.size >= 10000) {
      res.status(429).json({error:'Tente novamente mais tarde.'});
      return;
    }

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (record.count >= limit) {
      res.status(429).json({
        error: 'Limite de requisições excedido',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas solicitações em curto intervalo. Aguarde alguns segundos antes de tentar novamente.',
      });
      return;
    }

    record.count++;
    next();
  };
}
