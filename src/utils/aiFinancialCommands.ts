export type FinancialCommandDraft = {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string | null;
  requiresConfirmation: true;
};

export function parseFinancialCommand(
  input: string
): FinancialCommandDraft | null {
  if (typeof input !== 'string' || input.length > 2000) {
    return null;
  }

  const text = input.trim();

  const income = /^(?:registrar|lancar|lançar|adicionar)\s+(?:uma?\s+)?(?:receita|entrada|recebimento)\s+/i;
  const expense = /^(?:registrar|lancar|lançar|adicionar)\s+(?:uma?\s+)?(?:despesa|gasto|pagamento)\s+/i;

  const type = income.test(text)
    ? 'income'
    : expense.test(text)
      ? 'expense'
      : null;

  if (!type) return null;

  const remainder = text.replace(
    type === 'income' ? income : expense,
    ''
  ).trim();

  const match = remainder.match(
    /^(?:(?:de|no valor de)\s+)?(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:,\d{1,2})?)(?:\s+(?:reais?))?(?:\s+(?:com|referente a|para)\s+)(.+)$/i
  );

  if (!match) return null;

  const amount = Number(
    match[1].replace(/\./g, '').replace(',', '.')
  );

  const description = match[2].trim();

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1000000 ||
    !description ||
    description.length > 250
  ) {
    return null;
  }

  return {
    type,
    description,
    amount,
    date: null,
    requiresConfirmation: true,
  };
}