import { randomUUID } from 'node:crypto';
import {
  validateAiFinancialInput,
  type AiFinancialInput,
} from './aiFinancialValidation.js';

type FinancialRecord = {
  id: string;
  tenantId: string;
  type: 'income' | 'expense' | 'commission';
  category: string;
  description: string;
  amount: number;
  date: string;
  dueDate?: string;
  paymentMethod?: 'pix' | 'credit_card' | 'debit_card' | 'cash';
  status: 'paid' | 'pending' | 'void';
  operationKey?: string;
};

type AuditRecord = {
  id: string;
  tenantId: string;
  action: string;
  details: string;
  userId?: string;
  userRole?: string;
  timestamp: string;
};

type FinancialStore = {
  get: (key: 'financialTransactions') => FinancialRecord[];
  mutate: (
    fn: (data: {
      financialTransactions: FinancialRecord[];
      auditLogs: AuditRecord[];
    }) => void
  ) => void;
};

export class FinancialOperationConflict extends Error {
  constructor() {
    super('Identificador reutilizado com dados diferentes.');
    this.name = 'FinancialOperationConflict';
  }
}

export function createConfirmedAiFinancialTransaction(
  store: FinancialStore,
  rawInput: unknown,
  tenantId: string,
  userId: string,
  userRole: string
): { transaction: FinancialRecord; created: boolean } {
  const input: AiFinancialInput =
    validateAiFinancialInput(rawInput);

  if (!tenantId || !userId || !userRole) {
    throw new Error('Contexto autenticado obrigatório.');
  }

  const matches = (record: FinancialRecord) =>
    record.tenantId === tenantId &&
    record.operationKey === input.operationKey;

  const samePayload = (record: FinancialRecord) =>
    record.type === input.type &&
    record.description === input.description &&
    record.amount === input.amount &&
    record.date === input.date;

  const existing = store.get('financialTransactions').find(matches);

  if (existing) {
    if (!samePayload(existing)) {
      throw new FinancialOperationConflict();
    }

    return { transaction: existing, created: false };
  }

  const transaction: FinancialRecord = {
    id: `fin-${randomUUID()}`,
    tenantId,
    type: input.type,
    category: 'Assistente IA',
    description: input.description,
    amount: input.amount,
    date: input.date,
    dueDate: input.date,

    status: 'pending',
    operationKey: input.operationKey,
  };

  const audit: AuditRecord = {
    id: `audit-${randomUUID()}`,
    tenantId,
    action: 'AI_FINANCIAL_TRANSACTION_CREATED',
    details:
      `Operação ${input.operationKey}; ` +
      `tipo ${input.type}; valor ${input.amount}; ` +
      `documento ${transaction.id}`,
    userId,
    userRole,
    timestamp: new Date().toISOString(),
  };

  let result: FinancialRecord = transaction;
  let created = false;

  store.mutate((data) => {
    const duplicate = data.financialTransactions.find(matches);

    if (duplicate) {
      if (!samePayload(duplicate)) {
        throw new FinancialOperationConflict();
      }

      result = duplicate;
      return;
    }

    data.financialTransactions.unshift(transaction);
    data.auditLogs.unshift(audit);
    created = true;
  });

  return { transaction: result, created };
}