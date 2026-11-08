import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer
]);
import { useApp } from '../context/AppContext';
import { localDateKey } from '../utils/businessInsights';
import {
  groupIntelligenceRows,
  applyIntelligenceChartMode,
} from '../utils/intelligenceChartData';

type Period = 7 | 30 | 90 | 365;

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);


export const IntelligenceBIView: React.FC = () => {
  const { currentTenant, currentUser, financialTransactions } = useApp();
  const [period, setPeriod] = useState<Period>(30);
  const [chartMode, setChartMode] = useState<'accumulated' | 'daily'>('accumulated');
  const chartRef = useRef<HTMLDivElement>(null);

  const allowed = currentUser?.role === 'owner' ||
    currentUser?.role === 'manager';

  const report = useMemo(() => {
    const today = new Date();
    const dates: string[] = [];

    for (let i = period - 1; i >= 0; i--) {
      const day = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - i
      );
      dates.push(localDateKey(day));
    }

    const start = dates[0];
    const end = dates[dates.length - 1];

    const totals = new Map<string, {
      income: number;
      expense: number;
      commission: number;
    }>();

    dates.forEach(date => {
      totals.set(date, { income: 0, expense: 0, commission: 0 });
    });

    if (allowed && currentTenant?.id) {
      financialTransactions.forEach(tx => {
        if (
          tx.tenantId !== currentTenant.id ||
          tx.status !== 'paid' ||
          tx.date < start ||
          tx.date > end ||
          !totals.has(tx.date)
        ) return;

        if (
          tx.type !== 'income' &&
          tx.type !== 'expense' &&
          tx.type !== 'commission'
        ) return;

        const amount = Number(tx.amount);
        if (!Number.isFinite(amount) || amount < 0) return;

        const bucket = totals.get(tx.date)!;
        bucket[tx.type] += amount;
      });
    }

    const round = (value: number) => Math.round(value * 100) / 100;

    const rows = dates.map(date => {
      const values = totals.get(date)!;
      return {
        date,
        income: round(values.income),
        expense: round(values.expense),
        commission: round(values.commission),
      };
    });

    const income = round(rows.reduce((sum, row) => sum + row.income, 0));
    const expense = round(rows.reduce((sum, row) => sum + row.expense, 0));
    const commission = round(rows.reduce((sum, row) => sum + row.commission, 0));

    return {
      rows,
      income,
      expense,
      commission,
      net: round(income - expense - commission),
    };
  }, [currentTenant?.id, financialTransactions, period, allowed]);

  const chartRows = useMemo(() => {
    const grouped = groupIntelligenceRows(report.rows, period);
    return applyIntelligenceChartMode(grouped, chartMode);
  }, [report.rows, period, chartMode]);

  const groupingLabel =
    period <= 30 ? 'Diário' :
    period === 90 ? 'Semanal' : 'Mensal';

  const chartLabels = useMemo(() =>
    chartRows.map(row => {
      const label = (value: string) => {
        const [, month, day] = value.split('-');
        return `${day}/${month}`;
      };

      if (period === 365) {
        const [year, month] = row.startDate.split('-');
        return `${month}/${year}`;
      }

      if (period === 90) {
        return `${label(row.startDate)}–${label(row.endDate)}`;
      }

      return label(row.date);
    }),
    [chartRows, period]
  );

  useEffect(() => {
    if (!allowed || !chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const gradient = (
      top: string,
      bottom: string
    ) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: top },
      { offset: 1, color: bottom },
    ]);

    chart.setOption({
      animationDuration: 650,
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) => money(Number(value)),
      },
      legend: {
        bottom: 0,
        data: ['Receitas', 'Despesas e comissões'],
      },
      grid: {
        top: 24,
        left: 16,
        right: 20,
        bottom: 62,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartLabels,
        axisLabel: { color: '#667085', hideOverlap: true },
        axisLine: { lineStyle: { color: '#E6E8EC' } },
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: {
          color: '#667085',
          formatter: (value: number) =>
            value >= 1000 ? `${(value / 1000).toFixed(0)} mil` : `${value}`,
        },
        splitLine: {
          lineStyle: { color: '#E6E8EC', type: 'dashed' },
        },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
      ],
      series: [
        {
          name: 'Receitas',
          type: 'line',
          smooth: 0.3,
          showSymbol: false,
          symbolSize: 7,
          lineStyle: { width: 3, color: '#0D9488' },
          itemStyle: { color: '#0D9488' },
          areaStyle: {
            color: gradient(
              'rgba(13,148,136,0.40)',
              'rgba(13,148,136,0.01)'
            ),
          },
          data: chartRows.map(row => row.income),
        },
        {
          name: 'Despesas e comissões',
          type: 'line',
          smooth: 0.3,
          showSymbol: false,
          symbolSize: 6,
          lineStyle: { width: 2.5, color: '#F59E0B' },
          itemStyle: { color: '#F59E0B' },
          areaStyle: {
            color: gradient(
              'rgba(245,158,11,0.19)',
              'rgba(245,158,11,0.01)'
            ),
          },
          data: chartRows.map(row => row.totalExpense),
        },
      ],
    });

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [report, allowed, chartRows]);

  if (!allowed) {
    return (
      <section className="rounded-2xl bg-white p-6 border border-stone-200">
        <h1 className="text-xl font-bold">Intelligence BI</h1>
        <p className="mt-2 text-sm text-stone-600">
          Acesso restrito a proprietários e gerentes.
        </p>
      </section>
    );
  }

  const cards = [
    { label: 'Receitas recebidas', value: report.income, color: 'text-emerald-700' },
    { label: 'Despesas pagas', value: report.expense, color: 'text-amber-700' },
    { label: 'Comissões pagas', value: report.commission, color: 'text-amber-700' },
    { label: 'Resultado do período', value: report.net, color: 'text-stone-900' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          D'OR@NGE Intelligence
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
          Intelligence BI
        </h1>
        <p className="text-sm text-stone-500 mt-2">
          Evolução financeira de {currentTenant?.tradeName || 'sua empresa'}
        </p>
      </header>

      <div className="flex flex-wrap gap-2" aria-label="Período do relatório">
        {([7, 30, 90, 365] as const).map(days => (
          <button
            key={days}
            type="button"
            onClick={() => setPeriod(days)}
            aria-pressed={period === days}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              period === days
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {days === 365 ? '12 meses' : `${days} dias`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map(card => (
          <div
            key={card.label}
            className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5"
          >
            <p className="text-xs text-stone-500">{card.label}</p>
            <p className={`mt-2 text-lg sm:text-2xl font-bold ${card.color}`}>
              {money(card.value)}
            </p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-6">
        <h2 className="text-lg font-bold text-stone-900">
          Evolução financeira
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Receitas, despesas e comissões efetivamente pagas · Agrupamento: {groupingLabel}
        </p>

        <div className="flex flex-wrap gap-2 mt-4" aria-label="Tipo de gráfico">
          <button
            type="button"
            aria-pressed={chartMode === 'accumulated'}
            onClick={() => setChartMode('accumulated')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
              chartMode === 'accumulated'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-stone-700 border-stone-200'
            }`}
          >
            Evolução acumulada
          </button>

          <button
            type="button"
            aria-pressed={chartMode === 'daily'}
            onClick={() => setChartMode('daily')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
              chartMode === 'daily'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-stone-700 border-stone-200'
            }`}
          >
            Movimentação
          </button>
        </div>

        <div
          ref={chartRef}
          role="img"
          aria-label="Gráfico de evolução de receitas e despesas por dia"
          className="w-full h-[300px] sm:h-[390px] mt-5"
        />

        <p className="text-xs text-stone-500 mt-3">
          Valores em reais. Resultado = receitas menos despesas e comissões.
          Dados limitados à empresa selecionada.
        </p>
      </section>
    </div>
  );
};
