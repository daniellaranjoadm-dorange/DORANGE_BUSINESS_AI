import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Download, 
  Plus, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  Users, 
  CreditCard,
  Printer
} from 'lucide-react';
import { formatCurrencyBRL, formatDateBR } from '../utils/validators';

export const FinancialView: React.FC = () => {
  const { currentTenant, financialTransactions, appointments, professionals, createFinancialTransaction } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'commission'>('all');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState<boolean>(false);

  // Form de nova despesa/receita manual
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState<string>('Insumos');
  const [txDescription, setTxDescription] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txPaymentMethod, setTxPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash'>('pix');

  const filteredTx = financialTransactions.filter((f) => {
    if (filterType !== 'all' && f.type !== filterType) return false;
    return true;
  });

  const totalIncomes = financialTransactions
    .filter((f) => f.type === 'income' && f.status === 'paid')
    .reduce((a, b) => a + b.amount, 0);

  const totalExpenses = financialTransactions
    .filter((f) => f.type === 'expense')
    .reduce((a, b) => a + b.amount, 0);

  const totalCommissions = financialTransactions
    .filter((f) => f.type === 'commission')
    .reduce((a, b) => a + b.amount, 0);

  const netBalance = totalIncomes - totalExpenses - totalCommissions;

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || !txAmount) return;

    await createFinancialTransaction({
      type: txType,
      category: txCategory,
      description: txDescription,
      amount: parseFloat(txAmount),
      paymentMethod: txPaymentMethod,
    });

    setIsNewTxModalOpen(false);
    setTxDescription('');
    setTxAmount('');
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor (R$)', 'Status'];
    const rows = financialTransactions.map((t) => [
      t.date,
      t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Comissão',
      t.category,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.status === 'paid' ? 'Pago' : 'Pendente',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_${currentTenant?.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8">
      {/* Header com Ações de Exportação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-stone-900 text-xl sm:text-2xl">
            Gestão Financeira & Caixa
          </h1>
          <p className="text-xs text-stone-700">
            Controle de receitas, insumos, comissões de equipe e pagamentos ({currentTenant?.tradeName})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPixModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-xs"
          >
            <QrCode className="w-4 h-4 text-emerald-700" />
            Cobrar Sinal / Pix
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            Exportar Excel/CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>

          <button
            onClick={() => setIsNewTxModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Lançar Despesa
          </button>
        </div>
      </div>

      {/* KPI Cards Financeiros (Tabular Numerals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-700 mb-2">
            <span className="text-xs font-semibold">Receitas Realizadas</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display font-bold text-2xl text-emerald-700 tabular-nums">
            {formatCurrencyBRL(totalIncomes)}
          </div>
          <p className="text-[11px] text-stone-700 mt-1">Atendimentos concluídos</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-700 mb-2">
            <span className="text-xs font-semibold">Despesas & Insumos</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-display font-bold text-2xl text-rose-600 tabular-nums">
            {formatCurrencyBRL(totalExpenses)}
          </div>
          <p className="text-[11px] text-stone-700 mt-1">Géis, lixas e materiais</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-700 mb-2">
            <span className="text-xs font-semibold">Comissões da Equipe</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-display font-bold text-2xl text-amber-900 tabular-nums">
            {formatCurrencyBRL(totalCommissions)}
          </div>
          <p className="text-[11px] text-stone-700 mt-1">Repasses calculados</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-700 mb-2">
            <span className="text-xs font-semibold">Lucro Líquido Real</span>
            <DollarSign className="w-4 h-4 text-stone-900" />
          </div>
          <div className="font-display font-bold text-2xl text-stone-900 tabular-nums">
            {formatCurrencyBRL(netBalance)}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Margem operacional saudável</p>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
          <h3 className="font-display font-bold text-stone-900 text-sm">
            Livro Caixa & Movimentações
          </h3>

          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'income', label: 'Receitas' },
              { id: 'expense', label: 'Despesas' },
              { id: 'commission', label: 'Comissões' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  filterType === f.id
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-700 font-semibold">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Forma</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-stone-700 tabular-nums">
                    {formatDateBR(tx.date)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${
                      tx.type === 'income' 
                        ? 'text-emerald-700' 
                        : tx.type === 'expense' 
                        ? 'text-rose-600' 
                        : 'text-amber-700'
                    }`}>
                      {tx.type === 'income' ? 'Receita' : tx.type === 'expense' ? 'Despesa' : 'Comissão'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-700 font-medium">
                    {tx.category}
                  </td>
                  <td className="py-3 px-4 text-stone-900 font-medium">
                    {tx.description}
                  </td>
                  <td className="py-3 px-4 uppercase text-stone-700 text-[10px]">
                    {tx.paymentMethod || 'PIX'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums text-stone-900">
                    <span className={tx.type === 'expense' || tx.type === 'commission' ? 'text-rose-600' : 'text-emerald-700'}>
                      {tx.type === 'expense' || tx.type === 'commission' ? '-' : '+'} {formatCurrencyBRL(tx.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      tx.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {tx.status === 'paid' ? 'Quitado' : 'Previsto'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar Despesa */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-stone-900 text-base">
              Lançar Movimentação Financeira
            </h3>
            <form onSubmit={handleCreateTx} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    txType === 'expense' ? 'border-rose-600 bg-rose-50 text-rose-900' : 'border-stone-200 text-stone-600'
                  }`}
                >
                  Despesa / Insumo
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    txType === 'income' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-stone-200 text-stone-600'
                  }`}
                >
                  Receita Avulsa
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de luvas descartáveis e algodão"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewTxModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Simulador Pix */}
      {isPixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-display font-bold text-stone-900 text-base">
                Cobrança de Sinal por Pix
              </h3>
              <p className="text-xs text-stone-700 mt-0.5">
                Integração de pagamentos pendente de configuração.
              </p>
            </div>

            {/* Simulação QR Code Pix */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl inline-block mx-auto">
              <div className="w-40 h-40 bg-stone-900 rounded-xl flex items-center justify-center text-white text-xs p-4 font-mono text-center">
                DEMONSTRAÇÃO — SEM COBRANÇA
              </div>
            </div>

            <p className="text-[11px] text-stone-700">
              Valor sugerido de sinal: <strong>R$ 30,00</strong> para reserva garantida de horário e redução de no-shows.
            </p>

            <p className="text-xs text-stone-700">Nenhum código de pagamento é gerado. Para cobrar, utilize seu banco e confira valor e favorecido.</p>

            <button
              onClick={() => setIsPixModalOpen(false)}
              className="text-xs text-stone-700 hover:text-stone-900 font-semibold block mx-auto"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
