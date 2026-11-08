export type AiFinancialInput = {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  operationKey: string;
};

export function validateAiFinancialInput(
  input: unknown
): AiFinancialInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Lançamento financeiro inválido.');
  }

  const data = input as Record<string, unknown>;

  if (data.type !== 'income' && data.type !== 'expense') {
    throw new Error('Tipo financeiro inválido.');
  }

  if (
    typeof data.description !== 'string' ||
    !data.description.trim() ||
    data.description.trim().length > 250
  ) {
    throw new Error('Descrição financeira inválida.');
  }

  if (
    typeof data.amount !== 'number' ||
    !Number.isFinite(data.amount) ||
    data.amount <= 0 ||
    data.amount > 1000000 ||
    Math.round(data.amount * 100) !== data.amount * 100
  ) {
    throw new Error('Valor financeiro inválido.');
  }

  if (
    typeof data.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
  ) {
    throw new Error('Data financeira inválida.');
  }

  const [year, month, day] = data.date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error('Data inexistente.');
  }

  if (
    typeof data.operationKey !== 'string' ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(data.operationKey)
  ) {
    throw new Error('Identificador da operação inválido.');
  }

  return {
    type: data.type,
    description: data.description.trim(),
    amount: data.amount,
    date: data.date,
    operationKey: data.operationKey,
  };
}