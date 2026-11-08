export type IntelligencePeriod = 7 | 30 | 90 | 365;
export type IntelligenceChartMode = 'daily' | 'accumulated';

export interface IntelligenceChartRow {
  date: string;
  income: number;
  expense: number;
  commission: number;
}

export interface IntelligenceChartPoint extends IntelligenceChartRow {
  startDate: string;
  endDate: string;
  totalExpense: number;
}

const toCents = (value: number): number =>
  Math.round(value * 100);

const fromCents = (value: number): number =>
  value / 100;

function weekStart(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  const weekday = (value.getUTCDay() + 6) % 7;
  value.setUTCDate(value.getUTCDate() - weekday);
  return value.toISOString().slice(0, 10);
}

export function groupIntelligenceRows(
  rows: IntelligenceChartRow[],
  period: IntelligencePeriod
): IntelligenceChartPoint[] {
  const groups = new Map<string, {
    startDate: string;
    endDate: string;
    income: number;
    expense: number;
    commission: number;
  }>();

  const ordered = [...rows].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  for (const row of ordered) {
    const key =
      period <= 30 ? row.date :
      period === 90 ? weekStart(row.date) :
      row.date.slice(0, 7);

    let group = groups.get(key);

    if (!group) {
      group = {
        startDate: row.date,
        endDate: row.date,
        income: 0,
        expense: 0,
        commission: 0,
      };
      groups.set(key, group);
    }

    if (row.date < group.startDate) group.startDate = row.date;
    if (row.date > group.endDate) group.endDate = row.date;

    group.income += toCents(row.income);
    group.expense += toCents(row.expense);
    group.commission += toCents(row.commission);
  }

  return [...groups.values()].map(group => ({
    date: group.startDate,
    startDate: group.startDate,
    endDate: group.endDate,
    income: fromCents(group.income),
    expense: fromCents(group.expense),
    commission: fromCents(group.commission),
    totalExpense: fromCents(group.expense + group.commission),
  }));
}

export function applyIntelligenceChartMode(
  rows: IntelligenceChartPoint[],
  mode: IntelligenceChartMode
): IntelligenceChartPoint[] {
  if (mode === 'daily') {
    return rows.map(row => ({ ...row }));
  }

  let income = 0;
  let expense = 0;
  let commission = 0;

  return rows.map(row => {
    income += toCents(row.income);
    expense += toCents(row.expense);
    commission += toCents(row.commission);

    return {
      ...row,
      income: fromCents(income),
      expense: fromCents(expense),
      commission: fromCents(commission),
      totalExpense: fromCents(expense + commission),
    };
  });
}