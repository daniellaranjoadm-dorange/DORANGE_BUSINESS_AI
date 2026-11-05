import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, X, Check, AlertTriangle, FileText, ArrowRight, RefreshCw } from 'lucide-react';
import { formatCurrencyBRL } from '../utils/validators';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CatalogueImportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentTenant, createService, showNotification } = useApp();
  const [rawText, setRawText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const sampleWhatsAppText = `*TABELA DE VALORES 2026 - ATELIÊ DE UNHAS*
Manicure tradicional com cutilagem: R$ 45,00 (40 min)
Pedicure simples com esfoliação: R$ 50,00 (50 min)
Alongamento Fibra de Vidro curvatura C: R$ 220,00 (3 horas)
Manutenção de Fibra: R$ 130,00 (2 horas)
Banho de gel estruturado: R$ 120,00 (90 min)
Blindagem diamante fortalecedora: R$ 90,00 (1 hora)
Esmaltação em gel seca na cabine: R$ 85,00 (60 min)
Spa dos pés com massagem e sais: R$ 95,00 (60 min)
Nail art encapsulada por unha: R$ 25,00 (20 min)`;

  const sampleCsvText = `Nome;Categoria;Preço;Duração;Descrição
Alongamento Molde F1;Alongamento;190;140;Aplicação com tips de molde russo rápida
Pedicure Spa Relax;Pedicure;85;60;Banho de pés com sais de alfazema
Francesinha Reversa;Nail Art;45;30;Design em gel clássico com leito esculpido`;

  const handleParseWithAi = async () => {
    if (!rawText.trim()) {
      alert('Por favor, insira o texto, conversa de WhatsApp ou tabela para importação.');
      return;
    }
    setIsParsing(true);
    try {
      const res = await fetch('/api/ai/parse-catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          tenantId: currentTenant?.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao processar com a IA.');
      }

      const data = await res.json();
      setParsedItems(data.services || []);
      // Seleciona todos que não são duplicados por padrão
      setSelectedItems(
        (data.services || [])
          .map((item: any, idx: number) => (!item.isDuplicate ? idx : -1))
          .filter((i: number) => i !== -1)
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao interpretar catálogo.');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSaveConfirmed = async () => {
    if (selectedItems.length === 0) {
      alert('Selecione pelo menos um serviço para importar.');
      return;
    }

    setIsSaving(true);
    try {
      const itemsToSave = selectedItems.map((idx) => parsedItems[idx]);
      for (const item of itemsToSave) {
        await createService({
          name: item.name,
          category: item.category || 'Geral',
          description: item.description || '',
          durationMinutes: item.durationMinutes || 60,
          price: item.price || 50,
          materialsNeeded: [],
        });
      }
      showNotification(`${itemsToSave.length} serviços importados com sucesso!`, 'success');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar serviços.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden flex flex-col my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-900 text-base">
                Importar Meu Catálogo com IA
              </h3>
              <p className="text-xs text-stone-700">
                Cole conversas do WhatsApp, lista de preços, PDF ou CSV e a IA estruturará seus serviços
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
        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {parsedItems.length === 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Cole o texto, cardápio ou mensagem com seus serviços e preços:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRawText(sampleWhatsAppText)}
                    className="text-[11px] font-medium text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-1 rounded-md transition-colors"
                  >
                    Exemplo WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setRawText(sampleCsvText)}
                    className="text-[11px] font-medium text-stone-600 hover:text-stone-800 bg-stone-100 px-2 py-1 rounded-md transition-colors"
                  >
                    Exemplo CSV
                  </button>
                </div>
              </div>

              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Exemplo: Manicure simples R$ 45 40 min, Alongamento em gel R$ 180 2h30, Spa dos pés R$ 90..."
                className="w-full text-xs font-mono p-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-amber-600 outline-none transition-all leading-relaxed"
              />

              <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Dica:</strong> A inteligência artificial identificará automaticamente os nomes, valores em R$, durações em minutos ou horas e categorias. Você revisará tudo antes de gravar.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-stone-900 text-sm">
                    {parsedItems.length} serviços identificados pela IA
                  </h4>
                  <p className="text-xs text-stone-700">
                    Selecione quais deseja cadastrar definitivamente no catálogo do {currentTenant?.tradeName}.
                  </p>
                </div>
                <button
                  onClick={() => setParsedItems([])}
                  className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Voltar ao texto
                </button>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => {
                  const isChecked = selectedItems.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelect(idx)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isChecked 
                          ? 'border-amber-600 bg-amber-50/30' 
                          : 'border-stone-200 opacity-60 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">{item.name}</span>
                            <span className="text-[10px] text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                            {item.isDuplicate && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Já cadastrado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-700 mt-0.5 line-clamp-1">{item.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-stone-900 tabular-nums">
                          {formatCurrencyBRL(item.price)}
                        </span>
                        <p className="text-[10px] text-stone-700">{item.durationMinutes} min</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            Cancelar
          </button>

          {parsedItems.length === 0 ? (
            <button
              type="button"
              disabled={isParsing || !rawText.trim()}
              onClick={handleParseWithAi}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Interpretando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analisar com IA
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving || selectedItems.length === 0}
              onClick={handleSaveConfirmed}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition-all shadow-sm"
            >
              {isSaving ? 'Gravando no Catálogo...' : `Gravar ${selectedItems.length} Serviços`}
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
