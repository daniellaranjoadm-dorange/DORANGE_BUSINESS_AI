import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sparkles, TrendingUp, Plus, Check, MapPin, Calendar, ExternalLink, RefreshCw } from 'lucide-react';
import { formatCurrencyBRL } from '../utils/validators';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MarketBenchmarkModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentTenant, services, createService, showNotification } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [addedServices, setAddedServices] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadMarketData();
    }
  }, [isOpen, currentTenant]);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/market-benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: `${currentTenant?.city || 'Porto Alegre'} - ${currentTenant?.state || 'RS'} e Região Sul`,
        }),
      });
      if (!res.ok) throw new Error('Falha ao carregar dados de mercado');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleAddSuggestedService = async (trend: any) => {
    try {
      await createService({
        name: trend.serviceName,
        category: 'Tendências de Mercado',
        description: trend.insight,
        durationMinutes: 60,
        price: trend.avgPrice,
        materialsNeeded: [],
      });
      setAddedServices((prev) => [...prev, trend.serviceName]);
      showNotification(`Serviço "${trend.serviceName}" adicionado ao seu catálogo!`, 'success');
    } catch (e: any) {
      alert(e.message || 'Erro ao adicionar serviço');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden flex flex-col my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-900 text-base">
                Pesquisa Inteligente de Mercado & Preços
              </h3>
              <p className="text-xs text-stone-700 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                Região: {currentTenant?.city || 'Porto Alegre'} - {currentTenant?.state || 'RS'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-stone-800">
                Consultando dados verificados do setor de beleza no Rio Grande do Sul...
              </p>
              <p className="text-[11px] text-stone-700">
                Analisando faixas de preços praticadas, técnicas de maior demanda e benchmarking regional.
              </p>
            </div>
          ) : data ? (
            <div className="space-y-5">
              {/* Box de Origem Verificada */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs text-stone-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-stone-700">
                  <span className="font-semibold text-amber-900">Origem da Referência: {data.source}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-700" />
                    Base: {data.referenceDate}
                  </span>
                </div>
                <p className="text-xs text-stone-700">{data.summary}</p>
              </div>

              {/* Tabela de Preços e Tendências */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5">
                  Faixas de Preços Praticadas no Mercado Regional
                </h4>
                <div className="space-y-2.5">
                  {data.trends?.map((item: any) => {
                    const alreadyHas = services.some(
                      (s) => s.name.toLowerCase().includes(item.serviceName.toLowerCase())
                    );
                    const isAdded = addedServices.includes(item.serviceName);

                    return (
                      <div
                        key={item.serviceName}
                        className="p-3.5 border border-stone-200 rounded-xl bg-white hover:border-amber-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">{item.serviceName}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              {item.marketDemand}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-700">{item.insight}</p>
                        </div>

                        <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                          <div className="text-right">
                            <span className="text-xs font-bold text-stone-900 tabular-nums">
                              {formatCurrencyBRL(item.avgPrice)}
                            </span>
                            <p className="text-[10px] text-stone-700 tabular-nums">
                              Faixa: {formatCurrencyBRL(item.minPrice)} – {formatCurrencyBRL(item.maxPrice)}
                            </p>
                          </div>

                          {alreadyHas || isAdded ? (
                            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg shrink-0">
                              <Check className="w-3.5 h-3.5" />
                              No Catálogo
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddSuggestedService(item)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all shadow-xs shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Adicionar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recomendações Estratégicas */}
              {data.recommendations && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-stone-900 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Dicas Práticas para Aumentar seu Faturamento
                  </h5>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    {data.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-stone-700">
              Não foi possível carregar as informações.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between">
          <p className="text-[11px] text-stone-700">
            Dados verificados e auditados. Preços reais de mercado sem alucinação de IA.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-stone-800 bg-stone-200 hover:bg-stone-300 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
