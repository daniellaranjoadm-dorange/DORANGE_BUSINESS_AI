import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  Tenant, 
  Professional, 
  Service, 
  Appointment, 
  Customer, 
  FinancialTransaction, 
  BaseCatalogItem, 
  UserAccount, 
  InventoryItem, 
  MarketingPost, 
  ConnectedAccount, 
  PortfolioItem, 
  PackagePlan, 
  CustomerPackage, 
  AuditLog, 
  SubscriptionPlan 
} from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(__dirname, '..', 'data');
const DB_PATH = path.resolve(DATA_DIR, 'database.json');
const BACKUP_PATH = path.resolve(DATA_DIR, 'database.backup.json');

// Garante existência da pasta /data
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface DatabaseSchema {
  tenants: Tenant[];
  users: UserAccount[];
  professionals: Professional[];
  services: Service[];
  customers: Customer[];
  appointments: Appointment[];
  financialTransactions: FinancialTransaction[];
  inventory: InventoryItem[];
  marketingPosts: MarketingPost[];
  connectedAccounts: ConnectedAccount[];
  portfolio: PortfolioItem[];
  packagePlans: PackagePlan[];
  customerPackages: CustomerPackage[];
  auditLogs: AuditLog[];
  subscriptionPlans: SubscriptionPlan[];
  baseCatalog: BaseCatalogItem[];
  physicalResources?: {
    id: string;
    tenantId: string;
    name: string;
    type: 'chair' | 'room' | 'stretcher' | 'equipment';
    capacity: number;
    active: boolean;
  }[];
  blockedTimes: {
    id: string;
    tenantId: string;
    professionalId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }[];
  waitingList: {
    id: string;
    tenantId: string;
    customerName: string;
    customerPhone: string;
    desiredDate: string;
    serviceName: string;
    notes?: string;
    status: 'waiting' | 'notified' | 'scheduled';
    createdAt: string;
  }[];
  inventoryMovements: {
    id: string;
    tenantId: string;
    inventoryItemId: string;
    type: 'in' | 'out' | 'consumption';
    quantity: number;
    reason: string;
    createdAt: string;
  }[];
  aiUsage: {
    id: string;
    tenantId: string;
    operation: string;
    model: string;
    tokensEstimate: number;
    createdAt: string;
  }[];
}

const IMG_STUDIO = '/images/dorange_hero_studio_1793885623392.jpg';
const IMG_NAIL_ART = '/images/nail_art_elegance_1793885622656.jpg';
const IMG_BUILDER_GEL = '/images/nail_builder_gel_1793885623579.jpg';
const IMG_SPA_PEDICURE = '/images/nail_spa_pedicure_1793885623651.jpg';

// Catálogo Base Ampliado (31 serviços completos)
export const EXPANDED_BASE_CATALOG: BaseCatalogItem[] = [
  {
    name: 'Manicure tradicional',
    category: 'Manicure',
    defaultDurationMinutes: 40,
    suggestedPriceBRL: 45,
    estimatedCostBRL: 8,
    estimatedMarginPercent: 82,
    description: 'Cutilagem completa, lixamento, hidratação das mãos e esmaltação tradicional.',
    materialsNeeded: ['Alicate esterilizado', 'Lixa descartável', 'Esmalte', 'Óleo secante'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Pedicure tradicional',
    category: 'Pedicure',
    defaultDurationMinutes: 50,
    suggestedPriceBRL: 50,
    estimatedCostBRL: 10,
    estimatedMarginPercent: 80,
    description: 'Higienização profunda, esfoliação leve, cutilagem dos pés e esmaltação.',
    materialsNeeded: ['Bacia com protetor', 'Esfoliante', 'Alicate esterilizado', 'Hidratante'],
    imageUrl: IMG_SPA_PEDICURE,
  },
  {
    name: 'Manicure e pedicure (Combo)',
    category: 'Combos',
    defaultDurationMinutes: 90,
    suggestedPriceBRL: 85,
    estimatedCostBRL: 16,
    estimatedMarginPercent: 81,
    description: 'Combo completo de cuidados para mãos e pés com cutilagem e acabamento impecável.',
    materialsNeeded: ['Kit descartável mãos e pés', 'Cremes emolientes', 'Esmaltes selecionados'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Esmaltação em gel',
    category: 'Gel & Blindagem',
    defaultDurationMinutes: 60,
    suggestedPriceBRL: 80,
    estimatedCostBRL: 14,
    estimatedMarginPercent: 82,
    description: 'Unhas secas na cabine LED com brilho espelhado e durabilidade de 15 a 25 dias sem lascar.',
    materialsNeeded: ['Cabine UV/LED', 'Prep', 'Primer', 'Base em gel', 'Top coat no-wipe'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Remoção de esmaltação em gel',
    category: 'Remoções',
    defaultDurationMinutes: 30,
    suggestedPriceBRL: 35,
    estimatedCostBRL: 5,
    estimatedMarginPercent: 85,
    description: 'Remoção segura e não agressiva do esmalte em gel preservando a lâmina ungueal.',
    materialsNeeded: ['Broca de cerâmica', 'Removedor específico', 'Algodão e papel alumínio'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Blindagem de unhas',
    category: 'Gel & Blindagem',
    defaultDurationMinutes: 60,
    suggestedPriceBRL: 90,
    estimatedCostBRL: 15,
    estimatedMarginPercent: 83,
    description: 'Camada protetora em gel ou fibra para fortalecer unhas naturais fracas e quebradiças.',
    materialsNeeded: ['Prep', 'Primer', 'Gel base estruturador', 'Top coat'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Banho de gel',
    category: 'Gel & Blindagem',
    defaultDurationMinutes: 90,
    suggestedPriceBRL: 120,
    estimatedCostBRL: 20,
    estimatedMarginPercent: 83,
    description: 'Cobertura com gel construtor sobre o comprimento natural para resistência e acabamento sofisticado.',
    materialsNeeded: ['Gel construtor control', 'Pincel chanfrado', 'Cabine', 'Lixa buffer'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Alongamento em gel moldado',
    category: 'Alongamento',
    defaultDurationMinutes: 150,
    suggestedPriceBRL: 180,
    estimatedCostBRL: 32,
    estimatedMarginPercent: 82,
    description: 'Extensão esculpida no molde com curvatura C perfeita e ponto de tensão equilibrado.',
    materialsNeeded: ['Moldes adesivos', 'Gel construtor', 'Presilhas', 'Micromotor'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Alongamento em fibra de vidro',
    category: 'Alongamento',
    defaultDurationMinutes: 180,
    suggestedPriceBRL: 210,
    estimatedCostBRL: 35,
    estimatedMarginPercent: 83,
    description: 'Técnica premium com filamentos de fibra para curvatura perfeita e máxima naturalidade.',
    materialsNeeded: ['Filamento de fibra', 'Gel de capa base', 'Gel construtor', 'Lanterna LED'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Alongamento em molde F1 (Dual Form)',
    category: 'Alongamento',
    defaultDurationMinutes: 120,
    suggestedPriceBRL: 190,
    estimatedCostBRL: 30,
    estimatedMarginPercent: 84,
    description: 'Aplicação prática e ágil com tips de forma dual, resultando em acabamento simétrico e brilhante.',
    materialsNeeded: ['Formas F1', 'Poligel ou gel construtor', 'Pincel espátula', 'Cabine'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Alongamento em acrigel',
    category: 'Alongamento',
    defaultDurationMinutes: 150,
    suggestedPriceBRL: 170,
    estimatedCostBRL: 28,
    estimatedMarginPercent: 83,
    description: 'Combinação de pó acrílico e gel UV para máxima dureza em unhas que exigem resistência reforçada.',
    materialsNeeded: ['Pó acrílico polímero', 'Gel UV', 'Tips ou molde', 'Selante'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Manutenção de fibra de vidro',
    category: 'Alongamento',
    defaultDurationMinutes: 120,
    suggestedPriceBRL: 130,
    estimatedCostBRL: 20,
    estimatedMarginPercent: 84,
    description: 'Nivelamento da área de crescimento, reposição estrutural de fibra e novo acabamento.',
    materialsNeeded: ['Brocas de desbaste', 'Gel construtor', 'Top coat selante'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Manutenção de alongamento em gel',
    category: 'Alongamento',
    defaultDurationMinutes: 120,
    suggestedPriceBRL: 125,
    estimatedCostBRL: 18,
    estimatedMarginPercent: 85,
    description: 'Reforço do ponto de tensão e nova curvatura para alongamento em gel a cada 20-25 dias.',
    materialsNeeded: ['Brocas diamantadas', 'Gel construtor', 'Top coat'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Remoção de alongamento',
    category: 'Remoções',
    defaultDurationMinutes: 60,
    suggestedPriceBRL: 70,
    estimatedCostBRL: 8,
    estimatedMarginPercent: 88,
    description: 'Retirada completa do gel ou fibra com desbaste controlado e hidratação profunda.',
    materialsNeeded: ['Broca de tungstênio', 'Óleo de cutícula com vitaminas', 'Polidor'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Pedicure em gel',
    category: 'Pedicure',
    defaultDurationMinutes: 60,
    suggestedPriceBRL: 90,
    estimatedCostBRL: 14,
    estimatedMarginPercent: 84,
    description: 'Esmaltação em gel nos pés com durabilidade de até 40 dias sem desbotar ou descascar.',
    materialsNeeded: ['Kit pedicure', 'Base em gel', 'Top coat UV'],
    imageUrl: IMG_SPA_PEDICURE,
  },
  {
    name: 'Esmaltação permanente',
    category: 'Gel & Blindagem',
    defaultDurationMinutes: 60,
    suggestedPriceBRL: 85,
    estimatedCostBRL: 12,
    estimatedMarginPercent: 85,
    description: 'Camada de polímero fosco ou vitrificado de alta fixação para mãos impecáveis.',
    materialsNeeded: ['Primer', 'Esmalte permanente', 'Cabine LED'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Decoração encapsulada',
    category: 'Nail Art',
    defaultDurationMinutes: 45,
    suggestedPriceBRL: 60,
    estimatedCostBRL: 10,
    estimatedMarginPercent: 83,
    description: 'Flores secas, fitilhos, folha de ouro ou glitters encapsulados sob camada transparente de gel.',
    materialsNeeded: ['Folha de ouro', 'Glitters flocados', 'Gel clear'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Unhas baby boomer',
    category: 'Nail Art',
    defaultDurationMinutes: 60,
    suggestedPriceBRL: 65,
    estimatedCostBRL: 12,
    estimatedMarginPercent: 81,
    description: 'Degradê suave e sofisticado entre o rosa nude do leito e o branco ponta.',
    materialsNeeded: ['Gel baby boomer', 'Esponja degradê', 'Pincel esfumador'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Unhas baby color',
    category: 'Nail Art',
    defaultDurationMinutes: 60,
    suggestedPriceBRL: 70,
    estimatedCostBRL: 14,
    estimatedMarginPercent: 80,
    description: 'Degradê moderno com tons pastéis (lavanda, menta, pêssego ou rosa bebê).',
    materialsNeeded: ['Géis coloridos pastéis', 'Esponja de transição'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Unhas francesinha reversa',
    category: 'Nail Art',
    defaultDurationMinutes: 60,
    suggestedPriceBRL: 75,
    estimatedCostBRL: 15,
    estimatedMarginPercent: 80,
    description: 'Leito esculpido com curvatura perfeita e ponta branca ou glitterizada de alta definição.',
    materialsNeeded: ['Gel cover para leito', 'Gel white', 'Lixa de precisão'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Reconstrução de unha',
    category: 'Gel & Blindagem',
    defaultDurationMinutes: 30,
    suggestedPriceBRL: 30,
    estimatedCostBRL: 6,
    estimatedMarginPercent: 80,
    description: 'Conserto de unha quebrada, trincada ou com cantinho lascado.',
    materialsNeeded: ['Fibra de seda/vidro', 'Gel reparador', 'Cabine portátil'],
    imageUrl: IMG_BUILDER_GEL,
  },
  {
    name: 'Spa dos pés premium com hidromassagem',
    category: 'Pedicure',
    defaultDurationMinutes: 75,
    suggestedPriceBRL: 120,
    estimatedCostBRL: 22,
    estimatedMarginPercent: 81,
    description: 'Imersão terapêutica em sais de lavanda, esfoliação com açúcar mascavo, máscara de argila e massagem.',
    materialsNeeded: ['Sais de banho', 'Esfoliante natural', 'Argila verde/rosa', 'Creme de ureia 10%'],
    imageUrl: IMG_SPA_PEDICURE,
  },
  {
    name: 'Hidratação profunda de mãos com parafina',
    category: 'Manicure',
    defaultDurationMinutes: 30,
    suggestedPriceBRL: 45,
    estimatedCostBRL: 8,
    estimatedMarginPercent: 82,
    description: 'Banho de parafina cosmética aquecida para rejuvenescimento e maciez imediata da pele.',
    materialsNeeded: ['Parafina cosmética', 'Luvas térmicas', 'Sérum com ácido hialurônico'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Nail art simples',
    category: 'Nail Art',
    defaultDurationMinutes: 20,
    suggestedPriceBRL: 25,
    estimatedCostBRL: 3,
    estimatedMarginPercent: 88,
    description: 'Traços finos minimalistas, francesinha clássica ou folha de ouro delicada.',
    materialsNeeded: ['Pincel 000', 'Tinta acrílica', 'Selante'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Nail art elaborada com cristais',
    category: 'Nail Art',
    defaultDurationMinutes: 45,
    suggestedPriceBRL: 55,
    estimatedCostBRL: 9,
    estimatedMarginPercent: 83,
    description: 'Design artístico personalizado: pedrarias Swarovski, efeito mármore e traços geométricos.',
    materialsNeeded: ['Pedrarias', 'Cola UV para cristais', 'Gel spider'],
    imageUrl: IMG_NAIL_ART,
  },
  {
    name: 'Francesinha tradicional',
    category: 'Nail Art',
    defaultDurationMinutes: 15,
    suggestedPriceBRL: 15,
    estimatedCostBRL: 2,
    estimatedMarginPercent: 86,
    description: 'Finalização clássica sorriso ou diagonal com esmalte branco cremoso.',
    materialsNeeded: ['Pincel de precisão', 'Esmalte branco renda'],
    imageUrl: IMG_NAIL_ART,
  },
];

// Dados iniciais de seed para a persistência
function getInitialSeedData(): DatabaseSchema {
  return {tenants: [], users: [], professionals: [], services: [], customers: [], appointments: [], financialTransactions: [], inventory: [], marketingPosts: [], connectedAccounts: [], portfolio: [], packagePlans: [], customerPackages: [], auditLogs: [], subscriptionPlans: [], physicalResources: [], blockedTimes: [], waitingList: [], inventoryMovements: [], aiUsage: [], baseCatalog: EXPANDED_BASE_CATALOG};
}

class DatabaseManager {
  private data: DatabaseSchema;
  private locks: Map<string, Promise<void>> = new Map();

  constructor() {
    const lockPath=path.join(DATA_DIR,'database.lock');
    const claim=()=>fs.writeFileSync(lockPath,String(process.pid),{flag:'wx',mode:0o600});
    try { claim(); } catch(error:any) {
      if(error.code!=='EEXIST')throw error;
      const pid=Number(fs.readFileSync(lockPath,'utf8'));
      if(!Number.isInteger(pid)||pid<=0)throw Error('Lock inválido; revisão manual necessária.');
      let stale=false;try{process.kill(pid,0)}catch(e:any){if(e.code==='ESRCH')stale=true;}
      if(!stale)throw Error('Banco já aberto em outro processo. Pare o servidor antes de operar os dados.');
      fs.unlinkSync(lockPath);claim();
    }
    try { this.data = this.load(); } catch(error){fs.unlinkSync(lockPath);throw error;}
    process.once('exit',()=>{try{if(fs.readFileSync(lockPath,'utf8')===String(process.pid))fs.unlinkSync(lockPath);}catch{}});
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        for(const key of ['tenants','users','professionals','services','customers','appointments','financialTransactions','inventory'])if(!Array.isArray(parsed[key]))throw Error('Estrutura inválida: '+key);
        // Garante que o catálogo base expandido e novas tabelas estejam sincronizadas
        return {
          marketingPosts: [], connectedAccounts: [], portfolio: [], packagePlans: [], customerPackages: [], auditLogs: [], subscriptionPlans: [], physicalResources: [],
          ...parsed,
          baseCatalog: parsed.baseCatalog || EXPANDED_BASE_CATALOG,
          blockedTimes: parsed.blockedTimes || [],
          waitingList: parsed.waitingList || [],
          inventoryMovements: parsed.inventoryMovements || [],
          aiUsage: parsed.aiUsage || [],
        };
      }
      // Proteção de Recuperação R5.3: Se o banco principal sumir mas existir backup operacional válido
      if (fs.existsSync(BACKUP_PATH)) {
        const rawBackup = fs.readFileSync(BACKUP_PATH, 'utf-8');
        const parsedBackup = JSON.parse(rawBackup);
        for(const key of ['tenants','users','professionals','services','customers','appointments','financialTransactions','inventory'])if(!Array.isArray(parsedBackup[key]))throw Error('Backup inválido: '+key);
        console.warn('[DB R5.3] database.json ausente, mas backup válido localizado. Restaurando com segurança a partir de database.backup.json.');
        this.saveDirect(parsedBackup);
        return {
          marketingPosts: [], connectedAccounts: [], portfolio: [], packagePlans: [], customerPackages: [], auditLogs: [], subscriptionPlans: [], physicalResources: [],
          ...parsedBackup,
          baseCatalog: parsedBackup.baseCatalog || EXPANDED_BASE_CATALOG,
          blockedTimes: parsedBackup.blockedTimes || [],
          waitingList: parsedBackup.waitingList || [],
          inventoryMovements: parsedBackup.inventoryMovements || [],
          aiUsage: parsedBackup.aiUsage || [],
        };
      }
    } catch (e) {
      throw new Error('Banco inválido: inicialização interrompida para preservar dados. Restaure um backup validado.', { cause: e });
    }
    if (process.env.ALLOW_EMPTY_DB !== 'true') throw new Error('Banco ausente. Defina ALLOW_EMPTY_DB=true apenas para nova instalação.');
    const initial = getInitialSeedData();
    this.saveDirect(initial);
    return initial;
  }

  /**
   * Executa operação com mutex serializado para prevenção de race conditions
   * (concorrência de agendamentos no mesmo slot de data/hora/profissional)
   */
  public async runWithLock<T>(lockKey: string, fn: () => Promise<T> | T): Promise<T> {
    const currentLock = this.locks.get(lockKey) || Promise.resolve();
    let release: () => void = () => {};
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued=currentLock.then(() => nextLock);
    this.locks.set(lockKey, queued);

    await currentLock;
    try {
      return await fn();
    } finally {
      release();
      if (this.locks.get(lockKey) === queued) {
        this.locks.delete(lockKey);
      }
    }
  }

  public save(): void {
    try {
      // Cria backup antes de sobrescrever
      if (fs.existsSync(DB_PATH)) {
        fs.copyFileSync(DB_PATH, BACKUP_PATH);
      }
      this.saveDirect(this.data);
    } catch (err) {
      throw new Error('Falha ao persistir dados; operação cancelada.', { cause: err });
    }
  }

  private saveDirect(payload: DatabaseSchema): void {
    const temporary = `${DB_PATH}.${process.pid}.tmp`;
    try {
      const fd = fs.openSync(temporary, 'w', 0o600);
      try { fs.writeFileSync(fd, JSON.stringify(payload, null, 2), 'utf-8'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      fs.renameSync(temporary, DB_PATH);
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return structuredClone(this.data[key]);
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]): void {
    this.mutate(d => { d[key] = value; });
  }

  public mutate(fn: (db: DatabaseSchema) => void): void {
    const previous = this.data;
    this.data = structuredClone(previous);
    try { fn(this.data); this.save(); } catch (error) { this.data = previous; throw error; }
  }

  public logAudit(tenantId: string, action: string, details: string, userId?: string, userRole?: string): void {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      action,
      details,
      userId,
      userRole,
      timestamp: new Date().toISOString(),
    };
    this.mutate(d => { d.auditLogs.unshift(entry); });
  }
}

export const db = new DatabaseManager();
