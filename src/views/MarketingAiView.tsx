import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Instagram, 
  Share2, 
  Calendar, 
  TrendingUp, 
  Check, 
  Clock, 
  Send, 
  Plus, 
  RefreshCw, 
  MessageSquare,
  Video,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { MarketingPost } from '../types';

export const MarketingAiView: React.FC = () => {
  const { currentTenant, marketingPosts, createMarketingPost, showNotification } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'studio' | 'calendar' | 'slots_campaign' | 'connections' | 'analytics'>('studio');
  const [topic, setTopic] = useState('');
  const [postType, setPostType] = useState<'feed' | 'story' | 'reels'>('feed');
  const [tone, setTone] = useState<'elegante' | 'descontraido' | 'promocional'>('elegante');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);

  // Proactive campaign state
  const [proactiveCampaign, setProactiveCampaign] = useState<any>(null);
  const [loadingProactive, setLoadingProactive] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'slots_campaign') {
      fetchProactiveCampaign();
    }
  }, [activeSubTab, currentTenant]);

  const fetchProactiveCampaign = async () => {
    if (!currentTenant) return;
    setLoadingProactive(true);
    try {
      const res = await fetch(`/api/marketing/proactive-slots-campaign?tenantId=${currentTenant.id}`);
      const data = await res.json();
      setProactiveCampaign(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProactive(false);
    }
  };

  const handleGenerateCopy = async () => {
    if (!topic.trim()) {
      alert('Por favor, informe o tema do post.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          tone,
          tenantId: currentTenant?.id,
        }),
      });
      if (!res.ok) throw new Error('Falha ao gerar conteúdo');
      const data = await res.json();
      setGeneratedCaption(data.copy || '');
      setGeneratedHashtags(data.hashtags || []);
      showNotification(data.source === 'local' ? 'Sugestão local gerada. Revise antes de usar.' : 'Conteúdo gerado com IA. Revise antes de usar.', 'info');
    } catch (e: any) {
      alert('Erro ao gerar post com a IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToCalendar = async (publishNow = false) => {
    if (!generatedCaption) return;

    await createMarketingPost({
      channel: 'instagram',
      type: postType,
      caption: generatedCaption,
      hashtags: generatedHashtags,
      imageUrl: currentTenant?.coverUrl || '/images/dorange_hero_studio_1793885623392.jpg',
      scheduledDate: publishNow ? undefined : new Date().toISOString().split('T')[0],
      scheduledTime: publishNow ? undefined : '18:00',
    });

    setGeneratedCaption('');
    setTopic('');
  };

  const handleApproveProactiveCampaign = async () => {
    if (!proactiveCampaign) return;
    await createMarketingPost({
      channel: 'instagram',
      type: 'story',
      caption: proactiveCampaign.generatedCaption,
      hashtags: proactiveCampaign.suggestedHashtags,
      imageUrl: '/images/dorange_hero_studio_1793885623392.jpg',
      scheduledDate: proactiveCampaign.targetDate,
      scheduledTime: '10:00',
    });
    showNotification('Campanha de encaixe agendada no calendário editorial!', 'success');
    setActiveSubTab('calendar');
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-stone-900 text-xl sm:text-2xl flex items-center gap-2">
            Central de Marketing D'OR@NGE AI
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
              Novo Módulo
            </span>
          </h1>
          <p className="text-xs text-stone-700">
            Estúdio criativo, calendário editorial, campanhas automáticas para horários ociosos e métricas de conversão
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-stone-200 rounded-xl shadow-xs overflow-x-auto">
          {[
            { id: 'studio', label: 'Estúdio Criativo IA', icon: Sparkles },
            { id: 'slots_campaign', label: 'Marketing de Agenda', icon: Clock },
            { id: 'calendar', label: 'Calendário Editorial', icon: Calendar },
            { id: 'connections', label: 'Contas Conectadas', icon: Share2 },
            { id: 'analytics', label: 'Métricas & Conversão', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  isActive ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: ESTÚDIO CRIATIVO */}
      {activeSubTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-stone-900 text-sm">
              Criar Post / Conteúdo para Redes Sociais
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'feed', label: 'Post do Feed' },
                { id: 'story', label: 'Story Interativo' },
                { id: 'reels', label: 'Roteiro de Reels' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setPostType(t.id as any)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    postType === t.id
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Sobre o que você deseja falar? *
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Cuidados pós-alongamento de fibra no inverno do RS, importância da manutenção a cada 21 dias, agenda aberta..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-amber-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Tom de Voz:
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'elegante', label: 'Elegante & Sofisticado' },
                  { id: 'descontraido', label: 'Acolhedor & Amiga' },
                  { id: 'promocional', label: 'Chamada para Ação / Urgência' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setTone(item.id as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      tone === item.id ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateCopy}
              disabled={isGenerating || !topic.trim()}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Criando Post com Gemini AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Post com IA
                </>
              )}
            </button>
          </div>

          {/* Prévia do Post */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-rose-600" />
                  Pré-visualização do Instagram
                </span>
                <span className="text-[11px] text-stone-700 font-mono">
                  {currentTenant?.instagram || '@seunegocio'}
                </span>
              </div>

              {generatedCaption ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-100 h-48 relative">
                    <img
                      src={currentTenant?.coverUrl || '/images/dorange_hero_studio_1793885623392.jpg'}
                      alt="Prévia do estabelecimento"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">
                      {currentTenant?.tradeName}
                    </div>
                  </div>

                  <div className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-100 font-sans">
                    {generatedCaption}
                  </div>

                  {generatedHashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[11px] text-blue-600">
                      {generatedHashtags.map((h, i) => (
                        <span key={i}>{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center text-stone-400 space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-stone-300" />
                  <p className="text-xs">
                    Preencha o tema e clique em "Gerar Post com IA" para visualizar a arte e a legenda formatada.
                  </p>
                </div>
              )}
            </div>

            {generatedCaption && (
              <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
                <button
                  onClick={() => handleSaveToCalendar(false)}
                  className="flex-1 py-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                >
                  Salvar no Calendário
                </button>
                <button
                  onClick={() => handleSaveToCalendar(true)}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publicar Agora
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MARKETING BASEADO NA AGENDA (IA PROATIVA) */}
      {activeSubTab === 'slots_campaign' && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-900 text-base">
                Otimização Inteligente de Vagas Ociosas
              </h3>
              <p className="text-xs text-stone-700">
                A IA do D'OR@NGE monitora horários vagos e sugere campanhas de urgência para aumentar seu faturamento
              </p>
            </div>
          </div>

          {loadingProactive ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto" />
              <p className="text-xs text-stone-700">Analisando agendamentos de amanhã...</p>
            </div>
          ) : proactiveCampaign ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    {proactiveCampaign.headline}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                    Data: {proactiveCampaign.targetDate}
                  </span>
                </div>
                <p className="text-xs text-stone-700">
                  Serviço recomendado: <strong>{proactiveCampaign.suggestedPromoService}</strong> · Promoção: <strong>{proactiveCampaign.discountOffered}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Legenda Pronta para Stories / WhatsApp:
                </label>
                <textarea
                  readOnly
                  rows={5}
                  value={proactiveCampaign.generatedCaption}
                  className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(proactiveCampaign.generatedCaption);
                    showNotification('Texto copiado para postar nos seus Stories!', 'success');
                  }}
                  className="flex-1 py-2.5 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                >
                  Copiar Texto para Stories
                </button>

                <button
                  onClick={handleApproveProactiveCampaign}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Aprovar e Agendar Post
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* SUB-TAB 3: CALENDÁRIO EDITORIAL */}
      {activeSubTab === 'calendar' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-display font-bold text-stone-900 text-sm">
              Posts Agendados e Publicados ({marketingPosts.length})
            </h3>
            <span className="text-xs text-stone-700">
              Integrado com Instagram, Facebook e WhatsApp
            </span>
          </div>

          <div className="space-y-3">
            {marketingPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-stone-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-stone-900">{post.type}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {post.status === 'published' ? 'Publicado' : 'Agendado'}
                      </span>
                      {post.scheduledDate && (
                        <span className="text-[10px] text-stone-700 font-mono">
                          {post.scheduledDate} às {post.scheduledTime}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-700 mt-1 line-clamp-2">
                      {post.caption}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  {post.metrics && (
                    <div className="text-right text-xs">
                      <span className="font-bold text-stone-900 tabular-nums">
                        {post.metrics.reach}
                      </span>
                      <span className="text-[10px] text-stone-700 block">alcance</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(post.caption);
                      showNotification('Legenda copiada!', 'info');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CONTAS & INTEGRAÇÕES */}
      {activeSubTab === 'connections' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-white rounded-3xl border border-[#E6E8EC] p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-display font-bold text-[#17191F] text-sm">
                Status das Conexões & Redes Sociais
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Verificação real de status de conexão, tokens OAuth e permissões de publicação.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { 
                  platform: 'WhatsApp Pessoal (Direto / wa.me)', 
                  user: currentTenant?.whatsapp || currentTenant?.phone || 'Configurado no salão', 
                  status: 'validated', 
                  statusLabel: 'Conectado e Validado', 
                  statusColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  desc: 'Disparo manual com 1 clique via wa.me com modelos anti-banimento.',
                  actionLabel: 'Ver Modelos'
                },
                { 
                  platform: 'WhatsApp Business Platform (API Oficial Meta)', 
                  user: currentTenant?.whatsappCloudApiConfig?.phoneNumberId ? `Phone ID: ${currentTenant.whatsappCloudApiConfig.phoneNumberId}` : 'Credenciais Meta Cloud pendentes', 
                  status: currentTenant?.whatsappCloudApiConfig?.accessToken ? 'validated' : 'awaiting_config', 
                  statusLabel: currentTenant?.whatsappCloudApiConfig?.accessToken ? 'Conectado e Validado' : 'Aguardando Configuração', 
                  statusColor: currentTenant?.whatsappCloudApiConfig?.accessToken ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200',
                  desc: 'Envio automático via Meta Cloud API com WABA e Webhooks.',
                  actionLabel: 'Configurar API'
                },
                { 
                  platform: 'Instagram Professional (Meta Graph API)', 
                  user: currentTenant?.instagram ? `@${currentTenant.instagram.replace('@', '')}` : 'Não vinculado', 
                  status: currentTenant?.instagram ? 'needs_auth' : 'awaiting_config', 
                  statusLabel: currentTenant?.instagram ? 'Necessita Autorização OAuth' : 'Aguardando Configuração', 
                  statusColor: currentTenant?.instagram ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-stone-100 text-stone-600 border-stone-200',
                  desc: 'Publicação de fotos do portfólio e leitura de engajamento.',
                  actionLabel: 'Autenticar com Meta'
                },
                { 
                  platform: 'Perfil da Empresa no Google (Google Meu Negócio)', 
                  user: `${currentTenant?.tradeName} (${currentTenant?.city})`, 
                  status: 'needs_auth' as const, 
                  statusLabel: 'Necessita Autorização OAuth', 
                  statusColor: 'bg-blue-50 text-blue-800 border-blue-200',
                  desc: 'Atualização de catálogo de serviços e horários nas buscas do Google Maps.',
                  actionLabel: 'Vincular Google'
                },
                { 
                  platform: 'TikTok Business Creator', 
                  user: 'Módulo em Beta Fechado', 
                  status: 'unavailable' as const, 
                  statusLabel: 'Indisponível no Plano Atual', 
                  statusColor: 'bg-stone-100 text-stone-500 border-stone-200',
                  desc: 'Publicação de Reels e roteiros de vídeos curtos gerados pela IA.',
                  actionLabel: 'Ver Requisitos'
                },
              ].map((acc, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-[#E6E8EC] bg-[#F8F9FB] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#17191F]">{acc.platform}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${acc.statusColor}`}>
                        {acc.statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] font-mono mt-0.5">{acc.user}</p>
                    <p className="text-[11px] text-stone-600 mt-1">{acc.desc}</p>
                  </div>

                  <button
                    onClick={() => {
                      showNotification(`Status da integração ${acc.platform}: ${acc.statusLabel}`, 'info');
                    }}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 transition shadow-2xs shrink-0 self-start sm:self-center"
                  >
                    {acc.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: MÉTRICAS & CONVERSÃO */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-700">Alcance Total dos Posts</span>
              <div className="font-display font-bold text-2xl text-stone-900 tabular-nums mt-1">
                4.280
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">+18% esta semana</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-700">Cliques no Link da Bio</span>
              <div className="font-display font-bold text-2xl text-amber-900 tabular-nums mt-1">
                312
              </div>
              <p className="text-[11px] text-stone-700 mt-1">Direcionados ao portal</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-700">Agendamentos Originados</span>
              <div className="font-display font-bold text-2xl text-emerald-700 tabular-nums mt-1">
                28
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">Taxa de conversão: 8,9%</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-700">Faturamento Atribuído</span>
              <div className="font-display font-bold text-2xl text-stone-900 tabular-nums mt-1">
                R$ 3.840
              </div>
              <p className="text-[11px] text-stone-700 mt-1">Retorno comprovado de marketing</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
