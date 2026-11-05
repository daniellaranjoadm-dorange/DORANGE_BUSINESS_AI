import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { validateCPF, validateCNPJ, formatDocument, formatPhone } from '../utils/validators';
import { ImageUploader } from './ImageUploader';
import { BUSINESS_SEGMENTS } from '../data/businessSegments';
import { BusinessSegmentId } from '../types';
import { 
  X, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Building2, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Wand2,
  RefreshCw,
  Layers
} from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { 
    isOnboardingOpen, 
    setIsOnboardingOpen, 
    createTenant,
    setCurrentViewMode,
    setPublicBookingSlug,
    onboardingSetupWithAi,
    showNotification
  } = useApp();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSpecialtyPrompt, setAiSpecialtyPrompt] = useState<string>('');
  const [customName,setCustomName]=useState('');
  const [customPrice,setCustomPrice]=useState(50);
  const [customDuration,setCustomDuration]=useState(30);
  const [aiServices, setAiServices] = useState<any[]>([]);
  const [createdTenantData, setCreatedTenantData] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    businessSegment: 'nails' as BusinessSegmentId,
    name: '',
    email: '',
    password: '',
    document: '',
    documentType: 'CPF' as 'CPF' | 'CNPJ',
    tradeName: '',
    phone: '',
    whatsapp: '',
    city: 'Porto Alegre',
    state: 'RS',
    serviceType: 'establishment' as 'establishment' | 'domicile' | 'both',
    address: '',
    logoUrl: '',
    coverUrl: '',
    primaryColor: '#D97706',
    secondaryColor: '#FFFBEB',
    selectedServices: BUSINESS_SEGMENTS.nails.suggestedServices.map((s) => s.name),
    openTime: '09:00',
    closeTime: '19:00',
    breakStart: '12:30',
    breakEnd: '13:30',
    bufferMinutes: 10,
  });

  if (!isOnboardingOpen) return null;

  const currentSegmentConfig = BUSINESS_SEGMENTS[formData.businessSegment] || BUSINESS_SEGMENTS.nails;

  const colorPalettes = [
    { label: "D'OR@NGE Âmbar & Ouro", primary: '#D97706', secondary: '#FFFBEB' },
    { label: 'Grafite Executivo & Mármore', primary: '#17191F', secondary: '#F8F9FB' },
    { label: 'Rosa Quartzo & Luxo', primary: '#BE185D', secondary: '#FDF2F8' },
    { label: 'Nude Terracota Elegante', primary: '#C2410C', secondary: '#FFF7ED' },
    { label: 'Lilás Ametista Spa', primary: '#7C3AED', secondary: '#F5F3FF' },
    { label: 'Dourado Prestige', primary: '#C5A46D', secondary: '#FAF8F5' },
  ];

  // Document validation feedback
  const cleanDoc = formData.document.replace(/\D/g, '');
  const isDocValid = formData.documentType === 'CPF' 
    ? (cleanDoc.length === 11 ? validateCPF(formData.document) : false)
    : (cleanDoc.length === 14 ? validateCNPJ(formData.document) : false);

  const handleDocumentChange = (val: string) => {
    const formatted = formatDocument(val);
    const clean = val.replace(/\D/g, '');
    const detectedType = clean.length > 11 ? 'CNPJ' : 'CPF';
    setFormData((prev) => ({
      ...prev,
      document: formatted,
      documentType: detectedType,
    }));
  };

  const handleSegmentChange = (segId: BusinessSegmentId) => {
    setAiServices([]);
    const seg = BUSINESS_SEGMENTS[segId];
    if (!seg) return;
    setFormData((prev) => ({
      ...prev,
      businessSegment: segId,
      selectedServices: seg.suggestedServices.map((s) => s.name),
      primaryColor: segId === 'barber' ? '#17191F' : prev.primaryColor === '#17191F' ? '#D97706' : prev.primaryColor,
      bufferMinutes: seg.defaultSettings?.bufferBetweenMinutes || 10,
    }));
  };

  const handleAiAutoFill = async () => {
    try {
      setIsAiLoading(true);
      const promptToUse = aiSpecialtyPrompt.trim() || currentSegmentConfig.tagline;
      const setup = await onboardingSetupWithAi(
        promptToUse,
        formData.tradeName || undefined,
        `${formData.city} - ${formData.state}`,
        formData.businessSegment
      );

      if (setup) {
        setAiServices(setup.services || []);
        setFormData((prev) => ({
          ...prev,
          tradeName: setup.tradeName || prev.tradeName,
          primaryColor: setup.primaryColor || prev.primaryColor,
          selectedServices: Array.isArray(setup.services) && setup.services.length > 0 
            ? setup.services.map((s: any) => s.name) 
            : prev.selectedServices,
        }));
        showNotification('Configuração gerada pela IA aplicada com sucesso!', 'success');
      }
    } catch (err: any) {
      showNotification('Não foi possível gerar com IA no momento. Configure manualmente.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleService = (svcName: string) => {
    setFormData((prev) => {
      const exists = prev.selectedServices.includes(svcName);
      return {
        ...prev,
        selectedServices: exists
          ? prev.selectedServices.filter((s) => s !== svcName)
          : [...prev.selectedServices, svcName],
      };
    });
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const tenant = await createTenant({
        password: formData.password,
        openTime: formData.openTime, closeTime: formData.closeTime,
        breakStart: formData.breakStart, breakEnd: formData.breakEnd, bufferMinutes: formData.bufferMinutes,
        ...(aiServices.length ? {customServices: aiServices.filter(s=>formData.selectedServices.includes(s.name))} : {}),
        businessSegment: formData.businessSegment,
        name: formData.name,
        email: formData.email,
        document: formData.document,
        documentType: formData.documentType,
        tradeName: formData.tradeName,
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        city: formData.city,
        state: formData.state,
        serviceType: formData.serviceType,
        address: formData.address,
        logoUrl: formData.logoUrl,
        coverUrl: formData.coverUrl,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        selectedServiceNames: formData.selectedServices,
      });

      setCreatedTenantData(tenant);
      setStep(6);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header do Wizard */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <div>
              <h2 className="font-display font-bold text-stone-900 text-base">
                {step === 1 && 'Etapa 1 — Qual é o seu tipo de negócio?'}
                {step === 2 && 'Etapa 2 — Identificação & Contato'}
                {step === 3 && 'Etapa 3 — Logomarca & Identidade Visual'}
                {step === 4 && `Etapa 4 — Catálogo de ${currentSegmentConfig.terminology.servicePlural}`}
                {step === 5 && 'Etapa 5 — Agenda & Horários de Funcionamento'}
                {step === 6 && 'Etapa 6 — Publicação da Sua Página'}
              </h2>
              <p className="text-xs text-stone-600">
                {step === 6 ? 'Sua plataforma multissegmento está pronta para receber clientes' : `Passo ${step} de 5 para criar seu sistema personalizado`}
              </p>
            </div>
          </div>
          {step !== 6 && (
            <button
              onClick={() => setIsOnboardingOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Barra de Progresso */}
        <div className="h-1 bg-stone-100 w-full shrink-0">
          <div 
            className="h-full bg-stone-900 transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* Conteúdo das Etapas (Scrollável) */}
        <div className="p-4 sm:p-6 overflow-y-auto min-w-0 flex-1 space-y-6">

          {/* ETAPA 1: Seleção de Segmento */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-1">
                  Selecione a categoria principal do seu estabelecimento
                </p>
                <p className="text-xs text-stone-500">
                  O sistema carregará automaticamente serviços sugeridos, terminologia da agenda e inteligência artificial especializada.
                </p>
              </div>

              {/* Cards Visuais de Segmentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(BUSINESS_SEGMENTS).map((seg) => {
                  const isSelected = formData.businessSegment === seg.id;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => handleSegmentChange(seg.id)}
                      className={`min-w-0 p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-stone-900 bg-stone-900 text-white shadow-md ring-2 ring-stone-900/20'
                          : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50 text-stone-900'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {seg.code}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>

                      <div className="mt-3">
                        <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                          {seg.name}
                        </h4>
                        <p className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                          {seg.tagline}
                        </p>
                      </div>

                      <div className={`mt-3 pt-2.5 border-t text-[11px] font-medium flex flex-wrap gap-2 items-center justify-between ${
                        isSelected ? 'border-white/10 text-stone-300' : 'border-stone-100 text-stone-500'
                      }`}>
                        <span>Agenda: {seg.terminology.appointmentSingular}</span>
                        <span>{seg.suggestedServices.length} serviços base</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Ativação Rápida com IA */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-900">
                      Preenchimento Inteligente com Assistente de IA
                    </h5>
                    <p className="text-[11px] text-stone-500">
                      Descreva seu estilo ou diferencial e a IA preencherá sua configuração inicial.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiSpecialtyPrompt}
                    onChange={(e) => setAiSpecialtyPrompt(e.target.value)}
                    placeholder={`Ex: ${currentSegmentConfig.tagline}`}
                    className="min-w-0 flex-1 text-xs px-3 py-2 bg-white border border-stone-200 rounded-xl outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <button
                    type="button"
                    disabled={isAiLoading}
                    onClick={handleAiAutoFill}
                    className="px-3.5 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                  >
                    {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    Configurar com IA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: Identificação & Dados */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nome Completo do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nome do responsável"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nome Comercial do Estabelecimento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nome do seu negócio"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    E-mail Comercial *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contato@empresa.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Senha de Acesso *
                  </label>
                  <input
                    type="password"
                    minLength={12}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-900 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Documento com validação */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    CPF ou CNPJ (com validação de dígitos) *
                  </label>
                  {cleanDoc.length >= 11 && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                      isDocValid ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {isDocValid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {formData.documentType} Válido
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          {formData.documentType} Inválido
                        </>
                      )}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  value={formData.document}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  className={`w-full text-sm px-3.5 py-2.5 bg-stone-50 border rounded-xl outline-none transition-all ${
                    cleanDoc.length >= 11
                      ? isDocValid
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-rose-400 bg-rose-50/20'
                      : 'border-stone-200 focus:bg-white focus:border-stone-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    WhatsApp para Agendamentos *
                  </label>
                  <input
                    type="text"
                    placeholder="(51) 99876-5432"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value), whatsapp: formatPhone(e.target.value) })}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Cidade e Estado *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Porto Alegre"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="flex-1 text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-900 outline-none transition-all"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      className="w-16 text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-900 outline-none text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Modalidade de Atendimento *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'establishment', label: 'No Estabelecimento' },
                    { id: 'domicile', label: 'Apenas a Domicílio' },
                    { id: 'both', label: 'Ambos (Local e Domicílio)' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setFormData({ ...formData, serviceType: item.id as any })}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                        formData.serviceType === item.id
                          ? 'border-stone-900 bg-stone-900 text-white font-semibold shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.serviceType !== 'domicile' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Endereço Completo do Ponto de Atendimento
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número, sala ou bairro"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-900 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          )}

          {/* ETAPA 3: Identidade Visual & Upload Direto de Logomarca */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Upload direto de Logo */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                <ImageUploader
                  label="Logomarca Oficial da Empresa"
                  currentImageUrl={formData.logoUrl}
                  onImageSaved={(url) => setFormData((prev) => ({ ...prev, logoUrl: url }))}
                  aspectRatio="square"
                  type="logo"
                  suggestedWidth={512}
                  suggestedHeight={512}
                  helperText="Envie a logo do computador ou tire uma foto. Aparecerá no portal público e nos comprovantes."
                />
              </div>

              {/* Upload direto de Capa */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                <ImageUploader
                  label="Foto de Capa / Fachada (Banner)"
                  currentImageUrl={formData.coverUrl}
                  onImageSaved={(url) => setFormData((prev) => ({ ...prev, coverUrl: url }))}
                  aspectRatio="banner"
                  type="cover"
                  suggestedWidth={1200}
                  suggestedHeight={400}
                  helperText="Destaque no topo da página de agendamentos online."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Escolha a Paleta de Cores White-Label
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {colorPalettes.map((p) => {
                    const isSelected = formData.primaryColor === p.primary;
                    return (
                      <button
                        type="button"
                        key={p.label}
                        onClick={() => setFormData({ ...formData, primaryColor: p.primary, secondaryColor: p.secondary })}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-white"
                          style={{ backgroundColor: p.primary }}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <p className={`text-[11px] font-semibold truncate ${isSelected ? 'text-white' : 'text-stone-900'}`}>{p.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 4: Catálogo de Serviços do Segmento */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Serviços Sugeridos para {currentSegmentConfig.name}
                  </h4>
                  <p className="text-xs text-stone-500">
                    Selecione os que deseja ativar de início. Todos os preços e durações são editáveis.
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-stone-100 rounded-md font-semibold text-stone-700">
                  {formData.selectedServices.length} ativos
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <input aria-label="Nome do serviço personalizado" placeholder="Serviço personalizado" value={customName} onChange={e=>setCustomName(e.target.value)}/>
                <input aria-label="Preço" type="number" min="0" value={customPrice} onChange={e=>setCustomPrice(Number(e.target.value))}/>
                <input aria-label="Duração em minutos" type="number" min="5" value={customDuration} onChange={e=>setCustomDuration(Number(e.target.value))}/>
                <button type="button" onClick={()=>{if(!customName.trim())return;const base=aiServices.length?aiServices:currentSegmentConfig.suggestedServices.map(s=>({name:s.name,category:s.category,description:s.description,price:s.suggestedPriceBRL,durationMinutes:s.defaultDurationMinutes}));setAiServices([...base,{name:customName.trim(),category:'Personalizado',price:customPrice,durationMinutes:customDuration}]);setFormData(prev=>({...prev,selectedServices:[...prev.selectedServices,customName.trim()]}));setCustomName('')}}>Adicionar serviço</button>
              </div>
              <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
                {(aiServices.length ? aiServices.map(s=>({...s,suggestedPriceBRL:s.price,defaultDurationMinutes:s.durationMinutes})) : currentSegmentConfig.suggestedServices).map((svc) => {
                  const isChecked = formData.selectedServices.includes(svc.name);
                  return (
                    <div
                      key={svc.name}
                      onClick={() => toggleService(svc.name)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-stone-900 bg-stone-50'
                          : 'border-stone-200 bg-white opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900">{svc.name}</p>
                          <p className="text-[11px] text-stone-500">{svc.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xs font-bold text-stone-900">R$ {svc.suggestedPriceBRL.toFixed(2).replace('.', ',')}</p>
                        <p className="text-[10px] text-stone-500">{svc.defaultDurationMinutes} min</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ETAPA 5: Agenda & Horários */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">
                  Horário Padrão de Funcionamento
                </h4>
                <p className="text-xs text-stone-500">
                  Configuração aplicada aos dias úteis (Segunda a Sábado). Você poderá ajustar dias individualmente depois.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    value={formData.openTime}
                    onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Horário de Término
                  </label>
                  <input
                    type="time"
                    value={formData.closeTime}
                    onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label>Início da pausa<input type="time" value={formData.breakStart} onChange={e=>setFormData({...formData,breakStart:e.target.value})}/></label>
                <label>Fim da pausa<input type="time" value={formData.breakEnd} onChange={e=>setFormData({...formData,breakEnd:e.target.value})}/></label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Intervalo de Higienização e Preparo entre Clientes
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 5, 10, 15, 20, 30].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setFormData({ ...formData, bufferMinutes: mins })}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        formData.bufferMinutes === mins
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {mins === 0 ? 'Sem intervalo' : `${mins} minutos`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 6: Sucesso & Publicação */}
          {step === 6 && createdTenantData && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="font-display font-bold text-xl text-stone-900">
                  {createdTenantData.tradeName} Publicado com Sucesso!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
                  Sua plataforma white-label exclusiva de {currentSegmentConfig.name} está pronta para receber agendamentos.
                </p>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl max-w-md mx-auto text-left space-y-2">
                <p className="text-xs font-semibold text-stone-700">Seu link público de agendamentos:</p>
                <div className="flex items-center justify-between p-2.5 bg-white border border-stone-200 rounded-xl font-mono text-xs text-stone-900">
                  <span>dorange.ai/{createdTenantData.slug}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://dorange.ai/${createdTenantData.slug}`);
                      showNotification('Link copiado para a área de transferência!', 'success');
                    }}
                    className="text-xs font-semibold text-stone-900 hover:underline"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPublicBookingSlug(createdTenantData.slug);
                    setCurrentViewMode('public_booking');
                    setIsOnboardingOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver Página da Cliente
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer do Modal com Botões de Navegação */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between shrink-0">
          {step > 1 && step < 6 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          ) : <div />}

          {step < 5 && (
            <button
              type="button"
              disabled={step === 2 && (!formData.name || !formData.tradeName || !formData.email || !isDocValid)}
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 5 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinishOnboarding}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition-all shadow-md"
            >
              {isSubmitting ? 'Gerando sua Plataforma...' : 'Concluir & Publicar Empresa'}
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(false)}
              className="px-6 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors ml-auto"
            >
              Acessar Meu Painel de Gestão
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
