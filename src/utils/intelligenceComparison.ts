export type ComparisonMetric =
  | 'income'
  | 'expense'
  | 'commission'
  | 'net';

export type ComparisonTrend =
  | 'favorable'
  | 'unfavorable'
  | 'neutral';

export interface ComparisonResult {
  current: number;
  previous: number;
  difference: number;
  percentage: number | null;
  trend: ComparisonTrend;
}

export interface FinancialTotals {
  income: number;
  expense: number;
  commission: number;
  net: number;
}

const cents = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error('Valor financeiro invalido');
  }
  return Math.round(value * 100);
};

const money = (value: number): number => value / 100;

export function compareFinancialMetric(
  current: number,
  previous: number,
  metric: ComparisonMetric
): ComparisonResult {
  const currentCents = cents(current);
  const previousCents = cents(previous);
  const differenceCents = currentCents - previousCents;

  const percentage =
    previousCents === 0
      ? null
      : Math.round(
          (differenceCents / Math.abs(previousCents)) * 10000
        ) / 100;

  let trend: ComparisonTrend = 'neutral';

  if (differenceCents !== 0) {
    const increase = differenceCents > 0;

    if (metric === 'expense' || metric === 'commission') {
      trend = increase ? 'unfavorable' : 'favorable';
    } else {
      trend = increase ? 'favorable' : 'unfavorable';
    }
  }

  return {
    current: money(currentCents),
    previous: money(previousCents),
    difference: money(differenceCents),
    percentage,
    trend,
  };
}

export function compareFinancialPeriods(
  current: FinancialTotals,
  previous: FinancialTotals
): Record<ComparisonMetric, ComparisonResult> {
  return {
    income: compareFinancialMetric(
      current.income,
      previous.income,
      'income'
    ),
    expense: compareFinancialMetric(
      current.expense,
      previous.expense,
      'expense'
    ),
    commission: compareFinancialMetric(
      current.commission,
      previous.commission,
      'commission'
    ),
    net: compareFinancialMetric(
      current.net,
      previous.net,
      'net'
    ),
  };
}