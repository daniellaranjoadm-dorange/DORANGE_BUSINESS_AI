import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Clock, 
  Smartphone, 
  ExternalLink, 
  Check, 
  Wand2,
  X,
  Palette
} from 'lucide-react';
import { formatCurrencyBRL } from '../utils/validators';

export const OnboardingChecklist: React.FC = () => {
  const { 
    currentTenant, 
    services, 
    appointments, 
    setActiveTab, 
    setCurrentViewMode, 
    setPublicBookingSlug,
    onboardingSetupWithAi,
    createService,
    updateTenant,
    showNotification
  } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isAiSetupOpen, setIsAiSetupOpen] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('Atendimento personalizado, com qualidade, conforto e horários flexíveis');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiPreview, setAiPreview] = useState<any | null>(null);

  if (!currentTenant) return null;

  // Critérios reais de conclusão do checklist
  const steps = [
    {
      id: 'step-data',
      title: 'Dados da Empresa e Contato',
      desc: 'Nome fantasia, telefone e endereço configurados',
      done: Boolean(currentTenant.tradeName && currentTenant.phone),
      actionTab: 'settings' as const,
      actionLabel: 'Editar dados',
    },
    {
      id: 'step-brand',
      title: 'Identidade Visual & Cores',
      desc: 'Paleta personalizada e logotipo da empresa',
      done: Boolean(currentTenant.primaryColor && (currentTenant.logoUrl || currentTenant.coverUrl)),
      actionTab: 'settings' as const,
      actionLabel: 'Ajustar visual',
    },
    {
      id: 'step-services',
      title: 'Catálogo de Serviços',
      desc: `${services.length} serviço(s) cadastrado(s) (mínimo recomendado: 3)`,
      done: services.length >= 3,
      actionTab: 'catalog' as const,
      actionLabel: 'Ver catálogo',
    },
    {
      id: 'step-pricing',
      title: 'Precificação e Margem',
      desc: 'Custos e margens de lucro estimadas definidas',
      done: services.some((s) => s.costBRL > 0),
      actionTab: 'catalog' as const,
      actionLabel: 'Revisar preços',
    },
    {
      id: 'step-hours',
      title: 'Horários de Atendimento',
      desc: 'Agenda semanal e intervalo entre clientes configurados',
      done: Boolean(currentTenant.businessHours && Object.keys(currentTenant.businessHours).length > 0),
      actionTab: 'settings' as const,
      actionLabel: 'Configurar',
    },
    {
      id: 'step-whatsapp',
      title: 'Canal WhatsApp',
      desc: currentTenant.whatsappMode === 'business_platform' ? 'WhatsApp Business Oficial conectado' : 'WhatsApp Pessoal (wa.me) ativo',
      done: Boolean(currentTenant.whatsapp || currentTenant.phone),
      actionTab: 'whatsapp' as const,
      actionLabel: 'Central WhatsApp',
    },
    {
      id: 'step-portal',
      title: 'Portal de Agendamento da Empresa',
      desc: `Página pública exclusiva ativada: /${currentTenant.slug}`,
      done: Boolean(currentTenant.slug),
      actionTab: 'portal' as const,
      actionLabel: 'Abrir portal',
    },
    {
      id: 'step-first-booking',
      title: '1º Agendamento Realizado',
      desc: appointments.length > 0 ? `${appointments.length} agendamento(s) registrados na base` : 'Crie um atendimento de teste ou divulgue seu link',
      done: appointments.length > 0,
      actionTab: 'calendar' as const,
      actionLabel: 'Abrir agenda',
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleStepClick = (actionTab: string) => {
    if (actionTab === 'portal') {
      setPublicBookingSlug(currentTenant.slug);
      setCurrentViewMode('public_booking');
    } else {
      setActiveTab(actionTab as any);
    }
  };

  const handleGenerateAiSetup = async () => {
    try {
      setIsGenerating(true);
      const setup = await onboardingSetupWithAi(
        aiPrompt, 
        currentTenant.tradeName, 
        `${currentTenant.city} - ${currentTenant.state}`,
        currentTenant.businessSegment || 'nails'
      );
      setAiPreview(setup);
    } catch (e: any) {
      showNotification('Erro ao gerar configuração com sugestões locais.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAiSetup = async () => {
    if (!aiPreview) return;
    try {
      setIsGenerating(true);
      // 1. Atualiza dados do tenant
      await updateTenant(currentTenant.id, {
        tradeName: currentTenant.tradeName,
        primaryColor: currentTenant.primaryColor,
        description: aiPreview.welcomeBio || currentTenant.description,
      });

      // 2. Cria os serviços sugeridos que não existirem
      if (Array.isArray(aiPreview.services)) {
        for (const svc of aiPreview.services) {
          const exists = services.some((s) => s.name.toLowerCase() === svc.name.toLowerCase());
          if (!exists) {
            await createService({
              name: svc.name,
              category: svc.category || 'Serviços',
              durationMinutes: svc.durationMinutes ?? 60,
              price: svc.price ?? 0,
              costBRL: svc.costBRL ?? 0,
              description: svc.description || '',
            });
          }
        }
      }

      showNotification('Configuração completa aplicada com sucesso com sugestões locais!', 'success');
      setIsAiSetupOpen(false);
      setAiPreview(null);
    } catch (e: any) {
      showNotification('Erro ao aplicar configurações.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-2xs transition-all">
        {/* Header do Checklist */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-bold shrink-0">
              <Layers className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-[#17191F]">
                  Primeiros passos do negócio
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-[#17191F] border border-stone-200">
                  {progressPercent}% Concluído
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Complete as 8 etapas essenciais para operar seu negócio com marca própria com máxima produtividade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiSetupOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl transition shadow-2xs cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-200" />
              <span>Configurar com sugestões locais</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-[#667085] hover:text-[#17191F] hover:bg-stone-100 rounded-lg transition"
              title={isExpanded ? 'Recolher checklist' : 'Expandir checklist'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Barra de Progresso Visual */}
        <div className="mt-4">
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200">
            <div 
              className="bg-linear-to-r from-amber-600 to-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#667085] mt-1.5 font-medium">
            <span>{completedCount} de {steps.length} etapas concluídas</span>
            {progressPercent === 100 ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Etapas iniciais preenchidas. Revise a operação antes de divulgar.
              </span>
            ) : (
              <span>Faltam {steps.length - completedCount} etapas para 100%</span>
            )}
          </div>
        </div>

        {/* Lista de Etapas (Expansível) */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-stone-100">
            {steps.map((step, idx) => (
              <div 
                key={step.id}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition ${
                  step.done 
                    ? 'bg-stone-50/60 border-stone-200/70 text-stone-700' 
                    : 'bg-white border-[#E6E8EC] hover:border-amber-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="w-4 h-4 text-stone-300" />
                    )}
                  </div>
                  <div>
                    <h4 className={`text-xs font-semibold ${step.done ? 'text-stone-900 line-through opacity-80' : 'text-[#17191F]'}`}>
                      {idx + 1}. {step.title}
                    </h4>
                    <p className="text-[11px] text-[#667085] mt-0.5 line-clamp-1">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStepClick(step.actionTab)}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg shrink-0 transition flex items-center gap-1 ${
                    step.done
                      ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                      : 'text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold'
                  }`}
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Ativação Rápida com sugestões locais (1 Clique) */}
      {isAiSetupOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl p-6 relative animate-fade-in my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setIsAiSetupOpen(false); setAiPreview(null); }}
              className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-amber-700 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>D'OR@NGE Assistente de Ativação</span>
            </div>

            <h3 className="font-display font-bold text-xl text-[#17191F]">
              Configuração assistida do negócio com sugestões locais
            </h3>
            <p className="text-xs text-[#667085] mt-1">
              Descreva seu foco de trabalho ou clique em um modelo pronto. O assistente sugere serviços do seu nicho sem consumir IA externa. Revise preços e custos antes de aplicar.
            </p>

            {/* Modelos Rápidos */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAiPrompt('Atendimento premium com serviços personalizados e atenção aos detalhes')}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-50 hover:text-amber-900 border border-stone-200 transition"
              >
                ✨ Atendimento premium
              </button>
              <button
                type="button"
                onClick={() => setAiPrompt('Negócio com serviços completos e foco na fidelização dos clientes')}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-50 hover:text-amber-900 border border-stone-200 transition"
              >
                🌸 Serviços completos
              </button>
              <button
                type="button"
                onClick={() => setAiPrompt('Atendimento express com serviços rápidos e combos')}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-50 hover:text-amber-900 border border-stone-200 transition"
              >
                ⚡ Atendimento express
              </button>
            </div>

            {/* Input de Prompt */}
            <div className="mt-3">
              <label className="text-xs font-semibold text-[#17191F] block mb-1">
                Como você define seu espaço e técnicas?
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:border-amber-600 focus:outline-hidden resize-none bg-stone-50/50"
                placeholder="Ex: Descreva seus serviços, público e cidade..."
              />
            </div>

            {/* Prévia do Resultado */}
            {aiPreview && (
              <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#17191F]">{aiPreview.tradeName}</h4>
                    <p className="text-[11px] text-[#667085] mt-0.5">{aiPreview.welcomeBio}</p>
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full border border-white shadow-xs shrink-0" 
                    style={{ backgroundColor: aiPreview.primaryColor }}
                    title={`Cor principal: ${aiPreview.primaryColor}`}
                  />
                </div>

                <div className="border-t border-stone-200 pt-3">
                  <span className="text-[11px] font-bold text-[#17191F] block mb-2">
                    Serviços Sugeridos ({aiPreview.services?.length || 0}):
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {aiPreview.services?.map((svc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-stone-200/80">
                        <div>
                          <span className="font-medium text-stone-900">{svc.name}</span>
                          <span className="text-[10px] text-stone-400 block">{svc.durationMinutes} min • {svc.category}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#17191F]">{formatCurrencyBRL(svc.price)}</span>
                          <span className="text-[10px] text-emerald-700 block">Custo ~{formatCurrencyBRL(svc.costBRL)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ações do Modal */}
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => { setIsAiSetupOpen(false); setAiPreview(null); }}
                className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>

              {!aiPreview ? (
                <button
                  type="button"
                  onClick={handleGenerateAiSetup}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Analisando com sugestões locais...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gerar Proposta com sugestões locais</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyAiSetup}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Aplicando à empresa...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Aplicar sugestões na minha empresa</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
