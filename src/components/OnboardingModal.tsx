import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { validateCPF, validateCNPJ, formatDocument, formatPhone, formatCEP, validateCEP } from '../utils/validators';
import { fetchAddressByCEP } from '../utils/cep';
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
  Layers,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ShieldCheck,
  MapPin,
  Search
} from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { 
    isOnboardingOpen, 
    setIsOnboardingOpen, 
    createTenant,
    setCurrentViewMode,
    setPublicBookingSlug,
    setActiveTab,
    onboardingSetupWithAi,
    showNotification,
    beginOnboarding
  } = useApp();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step1Attempted, setStep1Attempted] = useState<boolean>(false);
  const ownerNameRef = useRef<HTMLInputElement>(null);
  const ownerEmailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);
  const segmentSectionRef = useRef<HTMLDivElement>(null);
  const ownerSectionRef = useRef<HTMLDivElement>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const cepCache = useRef<Record<string, any>>({});
  const lastQueriedCep = useRef<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isCepLoading, setIsCepLoading] = useState<boolean>(false);
  const [cepFeedback, setCepFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [aiSpecialtyPrompt, setAiSpecialtyPrompt] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState(50);
  const [customDuration, setCustomDuration] = useState(30);
  const [aiServices, setAiServices] = useState<any[]>([]);
  const [createdTenantData, setCreatedTenantData] = useState<any>(null);

  // Pré-carrega a sessão de onboarding logo na abertura do modal
  useEffect(() => {
    if (isOnboardingOpen) {
      beginOnboarding().catch((err) => {
        console.warn('[Onboarding] Pré-carregamento de sessão:', err.message);
      });
    }
  }, [isOnboardingOpen]);

  // Form State
  const [formData, setFormData] = useState({
    businessSegment: 'nails' as BusinessSegmentId,
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    document: '',
    documentType: 'CPF' as 'CPF' | 'CNPJ',
    tradeName: '',
    phone: '',
    whatsapp: '',
    city: 'Porto Alegre',
    state: 'RS',
    serviceType: 'establishment' as 'establishment' | 'domicile' | 'both',
    address: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    serviceArea: '',
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

  // Owner & Credentials Validation (Step 1)
  const isOwnerNameValid = formData.name.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isPasswordLengthValid = formData.password.length >= 12 && formData.password.length <= 128;
  const isPasswordMatch = formData.password.length > 0 && formData.password === formData.passwordConfirmation;
  const isStep1Valid = Boolean(formData.businessSegment) && isOwnerNameValid && isEmailValid && isPasswordLengthValid && isPasswordMatch;

  const step1MissingItems: string[] = [];
  if (!formData.businessSegment) step1MissingItems.push('Segmento de negócio');
  if (!isOwnerNameValid) step1MissingItems.push('Nome do proprietário (mín. 3 letras)');
  if (!isEmailValid) step1MissingItems.push('E-mail válido');
  if (!isPasswordLengthValid) step1MissingItems.push('Senha com 12+ caracteres');
  else if (!isPasswordMatch) step1MissingItems.push('Confirmação de senha idêntica');

  const step1RequirementsCount = [
    Boolean(formData.businessSegment),
    isOwnerNameValid,
    isEmailValid,
    isPasswordLengthValid,
    isPasswordMatch,
  ].filter(Boolean).length;

  const handleStep1Advance = () => {
    setStep1Attempted(true);
    if (!formData.businessSegment) {
      segmentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showNotification('Selecione o segmento do seu negócio.', 'error');
      return;
    }
    if (!isOwnerNameValid) {
      ownerNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ownerNameRef.current?.focus();
      showNotification('Informe o nome completo do proprietário (mínimo 3 letras).', 'error');
      return;
    }
    if (!isEmailValid) {
      ownerEmailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ownerEmailRef.current?.focus();
      showNotification('Informe um e-mail válido para acesso administrativo.', 'error');
      return;
    }
    if (!isPasswordLengthValid) {
      passwordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      passwordRef.current?.focus();
      showNotification('A senha do proprietário deve conter no mínimo 12 caracteres.', 'error');
      return;
    }
    if (!isPasswordMatch) {
      passwordConfirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      passwordConfirmRef.current?.focus();
      showNotification('A confirmação da senha deve ser idêntica à senha cadastrada.', 'error');
      return;
    }
    setSubmitError(null);
    setStep(2);
  };

  // Business & Location Validation (Step 2)
  const cleanDoc = formData.document.replace(/\D/g, '');
  // Documento: opcional no cadastro inicial para minimizar dados conforme LGPD; se preenchido, valida matematicamente
  const isDocValid = cleanDoc.length === 0 || (
    formData.documentType === 'CPF' 
      ? (cleanDoc.length === 11 ? validateCPF(formData.document) : false)
      : (cleanDoc.length === 14 ? validateCNPJ(formData.document) : false)
  );
  const isTradeNameValid = formData.tradeName.trim().length >= 2;
  const isPhoneValid = formData.phone.replace(/\D/g, '').length >= 10;
  const isCityValid = formData.city.trim().length >= 2;
  const isStateValid = formData.state.trim().length === 2;
  
  // Endereço conforme a modalidade:
  // - Apenas a domicílio: endereço físico não é obrigatório; cidade e estado são suficientes.
  // - No estabelecimento ou Ambos: exige endereço físico (rua e número, ou campo de endereço)
  const isAddressValid = formData.serviceType === 'domicile'
    ? true
    : (formData.street.trim().length >= 2 && formData.number.trim().length >= 1) || formData.address.trim().length >= 5;

  const isStep2Valid = isTradeNameValid && isDocValid && isPhoneValid && isCityValid && isStateValid && isAddressValid;

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

  const handleCepChange = async (rawVal: string) => {
    const formatted = formatCEP(rawVal);
    const clean = rawVal.replace(/\D/g, '').slice(0, 8);
    
    setFormData((prev) => ({
      ...prev,
      cep: formatted,
    }));

    if (clean.length < 8) {
      setCepFeedback(null);
      return;
    }

    if (clean === lastQueriedCep.current && cepCache.current[clean]) {
      const cached = cepCache.current[clean];
      setFormData((prev) => ({
        ...prev,
        street: cached.street || prev.street,
        neighborhood: cached.neighborhood || prev.neighborhood,
        city: cached.city || prev.city,
        state: cached.state || prev.state,
      }));
      setCepFeedback({ type: 'success', message: 'Endereço localizado (cache local).' });
      return;
    }

    // Consulta ViaCEP com fallback manual resiliente
    try {
      setIsCepLoading(true);
      setCepFeedback(null);
      lastQueriedCep.current = clean;
      
      const res = await fetchAddressByCEP(clean);
      if (res.success && res.data) {
        cepCache.current[clean] = res.data;
        setFormData((prev) => ({
          ...prev,
          street: res.data!.street || prev.street,
          neighborhood: res.data!.neighborhood || prev.neighborhood,
          city: res.data!.city || prev.city,
          state: res.data!.state || prev.state,
        }));
        setCepFeedback({
          type: 'success',
          message: `Endereço localizado: ${res.data.street ? `${res.data.street}, ` : ''}${res.data.neighborhood} - ${res.data.city}/${res.data.state}`,
        });
        setTimeout(() => {
          numberInputRef.current?.focus();
        }, 150);
      } else {
        setCepFeedback({
          type: 'error',
          message: res.error || 'CEP não localizado. Preencha os campos abaixo manualmente.',
        });
      }
    } catch {
      setCepFeedback({
        type: 'error',
        message: 'Serviço de CEP indisponível. Preencha o endereço manualmente.',
      });
    } finally {
      setIsCepLoading(false);
    }
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
    if (isSubmitting) return;
    setSubmitError(null);

    // Validações prévias
    if (!isStep1Valid) {
      setSubmitError('Por favor, revise os dados do proprietário e credenciais de acesso na Etapa 1.');
      setStep(1);
      return;
    }
    if (!isStep2Valid) {
      setSubmitError('Por favor, preencha o nome comercial e documento válido na Etapa 2.');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      // Montagem do endereço formatado
      let fullAddress = formData.address.trim();
      if (formData.serviceType === 'domicile') {
        fullAddress = formData.serviceArea 
          ? `Atendimento a domicílio na região: ${formData.serviceArea.trim()}`
          : 'Atendimento exclusivamente a domicílio';
      } else if (formData.street.trim()) {
        const parts = [
          formData.street.trim() + (formData.number.trim() ? `, ${formData.number.trim()}` : ''),
          formData.complement.trim() || null,
          formData.neighborhood.trim() || null,
          formData.cep.trim() ? `CEP ${formData.cep.trim()}` : null,
        ].filter(Boolean);
        fullAddress = parts.join(' - ');
      }

      const tenant = await createTenant({
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        breakStart: formData.breakStart,
        breakEnd: formData.breakEnd,
        bufferMinutes: formData.bufferMinutes,
        ...(aiServices.length ? { customServices: aiServices.filter(s => formData.selectedServices.includes(s.name)) } : {}),
        businessSegment: formData.businessSegment,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        document: formData.document,
        documentType: formData.documentType,
        tradeName: formData.tradeName.trim(),
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        serviceType: formData.serviceType,
        address: fullAddress,
        cep: formData.cep.trim(),
        neighborhood: formData.neighborhood.trim(),
        logoUrl: formData.logoUrl,
        coverUrl: formData.coverUrl,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        selectedServiceNames: formData.selectedServices,
      });

      setCreatedTenantData(tenant);
      setStep(6);
    } catch (err: any) {
      const message = err.message || 'Erro ao processar o cadastro da empresa.';
      setSubmitError(message);
      showNotification(message, 'error');
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
                {step === 1 && 'Etapa 1 — Tipo de Negócio & Proprietário'}
                {step === 2 && 'Etapa 2 — Identificação do Estabelecimento & Contato'}
                {step === 3 && 'Etapa 3 — Logomarca & Identidade Visual'}
                {step === 4 && `Etapa 4 — Catálogo de ${currentSegmentConfig.terminology.servicePlural}`}
                {step === 5 && 'Etapa 5 — Agenda & Horários de Funcionamento'}
                {step === 6 && 'Etapa 6 — Publicação & Acesso ao Painel'}
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
              title="Fechar cadastro"
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

        {/* Banner de Erro Global de Submissão */}
        {submitError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="flex-1 font-medium">{submitError}</div>
            <button 
              onClick={() => setSubmitError(null)}
              className="text-rose-500 hover:text-rose-700 text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Conteúdo das Etapas (Scrollável) */}
        <div className="p-4 sm:p-6 overflow-y-auto min-w-0 flex-1 space-y-6">

          {/* ETAPA 1: Tipo de Negócio & Cadastro do Proprietário */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Barra de Progresso e Resumo da Etapa 1 */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Progresso da Etapa 1
                    </span>
                    <span className="text-xs font-semibold text-stone-900">
                      ({step1RequirementsCount} de 5 requisitos atendidos)
                    </span>
                  </div>
                  <div className="w-full sm:w-48 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        isStep1Valid ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${(step1RequirementsCount / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 shadow-2xs">
                    <Layers className="w-3.5 h-3.5 text-stone-500" />
                    <span>Segmento: <strong>{currentSegmentConfig.name}</strong></span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-2xs font-medium ${
                    isOwnerNameValid && isEmailValid && isPasswordLengthValid && isPasswordMatch
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    {isOwnerNameValid && isEmailValid && isPasswordLengthValid && isPasswordMatch ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Proprietário Validado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Dados do Proprietário Pendentes</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* SEÇÃO 1: Tipo de Negócio (Seleção do Segmento) */}
              <div ref={segmentSectionRef} className="p-4 sm:p-5 bg-stone-50/70 border border-stone-200 rounded-2xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-200/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                        Seção 1 — Tipo de Negócio (Segmento Comercial)
                      </h3>
                      <p className="text-[11px] text-stone-600">
                        Selecione a área do seu negócio. A plataforma adaptará catálogo sugerido, regras e IA.
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-800 flex items-center gap-1 shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    Ativo: {currentSegmentConfig.code}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {Object.values(BUSINESS_SEGMENTS).map((seg) => {
                    const isSelected = formData.businessSegment === seg.id;
                    return (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => handleSegmentChange(seg.id)}
                        className={`min-w-0 p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/20'
                            : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50 text-stone-900'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {seg.code}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className="mt-2">
                          <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                            {seg.name}
                          </h4>
                          <p className={`text-[10.5px] mt-0.5 leading-snug line-clamp-2 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                            {seg.tagline}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SEÇÃO 2: Dados do Proprietário & Credenciais de Acesso */}
              <div ref={ownerSectionRef} className="p-4 sm:p-5 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                        Seção 2 — Dados do Proprietário & Credenciais de Acesso
                      </h3>
                      <p className="text-[11px] text-stone-600">
                        O proprietário será registrado com perfil OWNER para administrar o estabelecimento e equipe.
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                    Administrador OWNER
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nome Completo do Proprietário *
                    </label>
                    <div className="relative">
                      <input
                        ref={ownerNameRef}
                        type="text"
                        required
                        placeholder="Ex: Daniel Laranjo"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full text-xs px-3.5 py-2.5 bg-stone-50/50 border rounded-xl outline-none transition-all ${
                          (step1Attempted || formData.name.length > 0) && !isOwnerNameValid
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                            : isOwnerNameValid
                            ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600'
                            : 'border-stone-200 focus:bg-white focus:border-stone-900'
                        }`}
                      />
                    </div>
                    {(step1Attempted || (formData.name.length > 0 && !isOwnerNameValid)) && !isOwnerNameValid ? (
                      <span className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Informe o nome completo do titular (mínimo 3 letras).
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 mt-1 block">
                        Nome do titular responsável pela conta.
                      </span>
                    )}
                  </div>

                  {/* E-mail de Login */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      E-mail de Login do Proprietário *
                    </label>
                    <div className="relative">
                      <input
                        ref={ownerEmailRef}
                        type="email"
                        required
                        autoComplete="username"
                        placeholder="proprietario@empresa.com.br"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full text-xs px-3.5 py-2.5 bg-stone-50/50 border rounded-xl outline-none transition-all ${
                          (step1Attempted || formData.email.length > 0) && !isEmailValid
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                            : isEmailValid
                            ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600'
                            : 'border-stone-200 focus:bg-white focus:border-stone-900'
                        }`}
                      />
                    </div>
                    {(step1Attempted || (formData.email.length > 0 && !isEmailValid)) && !isEmailValid ? (
                      <span className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Informe um e-mail válido com @ e domínio.
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 mt-1 block">
                        Utilizado para acessar o painel de gestão.
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Senha */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-stone-700">
                        Senha de Acesso *
                      </label>
                      <span className={`text-[10px] font-mono ${
                        formData.password.length >= 12 ? 'text-emerald-700 font-semibold' : 'text-stone-500'
                      }`}>
                        {formData.password.length}/12 caracteres mín.
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        minLength={12}
                        maxLength={128}
                        required
                        autoComplete="new-password"
                        placeholder="Mínimo 12 caracteres"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full text-xs px-3.5 py-2.5 pr-9 bg-stone-50/50 border rounded-xl outline-none transition-all ${
                          (step1Attempted || formData.password.length > 0) && !isPasswordLengthValid
                            ? 'border-amber-400 bg-amber-50/20 focus:border-amber-500'
                            : isPasswordLengthValid
                            ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600'
                            : 'border-stone-200 focus:bg-white focus:border-stone-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                        title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {(step1Attempted || (formData.password.length > 0 && !isPasswordLengthValid)) && !isPasswordLengthValid ? (
                      <span className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        A senha precisa ter no mínimo 12 caracteres (atual: {formData.password.length}).
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 mt-1 block">
                        Criptografia segura scrypt aplicada no servidor.
                      </span>
                    )}
                  </div>

                  {/* Confirmação de Senha */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-stone-700">
                        Confirme a Senha *
                      </label>
                      {formData.passwordConfirmation && (
                        <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                          isPasswordMatch ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                          {isPasswordMatch ? 'Senhas coincidem' : 'Divergência'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        ref={passwordConfirmRef}
                        type={showPasswordConfirmation ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="Repita a senha de acesso"
                        value={formData.passwordConfirmation}
                        onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
                        className={`w-full text-xs px-3.5 py-2.5 pr-9 bg-stone-50/50 border rounded-xl outline-none transition-all ${
                          (step1Attempted || formData.passwordConfirmation.length > 0) && !isPasswordMatch
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                            : isPasswordMatch
                            ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600'
                            : 'border-stone-200 focus:bg-white focus:border-stone-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                        title={showPasswordConfirmation ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showPasswordConfirmation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {(step1Attempted || (formData.passwordConfirmation.length > 0 && !isPasswordMatch)) && !isPasswordMatch ? (
                      <span className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        A confirmação deve ser exatamente idêntica à senha.
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 mt-1 block">
                        Repita exatamente a mesma senha digitada.
                      </span>
                    )}
                  </div>
                </div>

                {/* Resumo de Campos Faltantes da Etapa 1 */}
                {step1Attempted && !isStep1Valid && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Complete os campos obrigatórios para avançar:
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-800">
                      {!formData.businessSegment && <li>Selecione o segmento do seu negócio na Seção 1.</li>}
                      {!isOwnerNameValid && <li>Informe o nome completo do proprietário (mínimo 3 letras).</li>}
                      {!isEmailValid && <li>Informe um e-mail válido para acesso administrativo.</li>}
                      {!isPasswordLengthValid && <li>Defina uma senha com no mínimo 12 caracteres.</li>}
                      {isPasswordLengthValid && !isPasswordMatch && <li>A confirmação de senha precisa coincidir com a senha.</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 2: Identificação do Estabelecimento & Endereço */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-1">
                  Dados do Estabelecimento & Contato Comercial
                </p>
                <p className="text-xs text-stone-500">
                  Estas informações aparecerão no portal público de agendamentos e nos comprovantes aos clientes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nome Comercial do Estabelecimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Studio D'OR@NGE ou Barbearia Imperial"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-900 outline-none transition-all"
                />
              </div>

              {/* Documento com validação matemática clara */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      CPF ou CNPJ
                    </label>
                    <span className="text-[10px] text-stone-400 font-normal">
                      (Opcional no período de testes — LGPD)
                    </span>
                  </div>
                  {cleanDoc.length >= 11 && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                      isDocValid ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {isDocValid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {formData.documentType} — Dígitos verificadores válidos
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          {formData.documentType} Inválido (dígitos incorretos)
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
                <p className="text-[10px] text-stone-400 mt-1">
                  Validação matemática de formato e dígitos verificadores. Não realiza consulta a órgãos federais.
                </p>
              </div>

              {/* Contato comercial */}
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
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Modalidade de Atendimento *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'establishment', label: 'No Local' },
                      { id: 'domicile', label: 'Domicílio' },
                      { id: 'both', label: 'Ambos' },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setFormData({ ...formData, serviceType: item.id as any })}
                        className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
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
              </div>

              {/* Seção de Endereço com Busca Automática por CEP */}
              <div className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-stone-700" />
                    <span className="text-xs font-bold text-stone-800">
                      {formData.serviceType === 'domicile' ? 'Localização da Operação (Domicílio)' : 'Endereço do Estabelecimento'}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500">
                    {formData.serviceType === 'domicile' ? 'Endereço físico opcional' : 'Preenchimento automático via CEP'}
                  </span>
                </div>

                {/* Campo CEP com lookup em tempo real */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    CEP {formData.serviceType !== 'domicile' && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      maxLength={9}
                      className="w-full text-sm px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-stone-900 outline-none pr-10 transition-all font-mono"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-stone-400">
                      {isCepLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-stone-700" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Feedback de busca de CEP */}
                  {cepFeedback && (
                    <div className={`mt-1.5 text-[11px] flex items-center gap-1.5 p-2 rounded-lg ${
                      cepFeedback.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {cepFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      )}
                      <span>{cepFeedback.message}</span>
                    </div>
                  )}
                </div>

                {/* Logradouro e Número */}
                {formData.serviceType !== 'domicile' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Logradouro / Rua *
                      </label>
                      <input
                        type="text"
                        placeholder="Rua, Avenida, Praça..."
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-stone-900 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Número *
                      </label>
                      <input
                        ref={numberInputRef}
                        type="text"
                        placeholder="123 ou S/N"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-stone-900 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Complemento e Bairro */}
                {formData.serviceType !== 'domicile' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Complemento <span className="font-normal text-stone-400">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Sala 204, Bloco B, Fundos"
                        value={formData.complement}
                        onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-stone-900 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        placeholder="Centro, Moinhos de Vento..."
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-stone-900 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Cidade e UF */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      placeholder="Porto Alegre"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-stone-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Estado / UF *
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="RS"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      className="w-full text-sm px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-stone-900 outline-none text-center font-bold"
                    />
                  </div>
                </div>

                {/* Região de atendimento para modalidade a domicílio */}
                {formData.serviceType !== 'establishment' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Região / Bairros Atendidos a Domicílio <span className="font-normal text-stone-400">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Zona Norte, Centro Histórico e Menino Deus"
                      value={formData.serviceArea}
                      onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-stone-900 outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 3: Identidade Visual & Upload de Imagens */}
          {step === 3 && (
            <div className="space-y-6">
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

              {/* Adicionar Serviço Personalizado */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block">
                  Adicionar outro serviço ao catálogo
                </span>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                  <input
                    type="text"
                    aria-label="Nome do serviço personalizado"
                    placeholder="Nome do serviço (ex: Pacote Especial)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 min-w-[160px] text-xs px-3 py-2 bg-white border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-stone-500 font-semibold">R$</span>
                    <input
                      type="number"
                      aria-label="Preço em Reais"
                      min="0"
                      step="5"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      className="w-20 text-xs px-2.5 py-2 bg-white border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      aria-label="Duração em minutos"
                      min="5"
                      step="5"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(Number(e.target.value))}
                      className="w-16 text-xs px-2 py-2 bg-white border border-stone-200 rounded-xl outline-none focus:border-stone-900 text-center"
                    />
                    <span className="text-[11px] text-stone-500 font-semibold">min</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customName.trim()) return;
                      const base = aiServices.length
                        ? aiServices
                        : currentSegmentConfig.suggestedServices.map((s) => ({
                            name: s.name,
                            category: s.category,
                            description: s.description,
                            price: s.suggestedPriceBRL,
                            durationMinutes: s.defaultDurationMinutes,
                          }));
                      setAiServices([
                        ...base,
                        {
                          name: customName.trim(),
                          category: 'Personalizado',
                          description: 'Serviço adicionado durante o cadastro',
                          price: customPrice,
                          durationMinutes: customDuration,
                        },
                      ]);
                      setFormData((prev) => ({
                        ...prev,
                        selectedServices: [...prev.selectedServices, customName.trim()],
                      }));
                      setCustomName('');
                    }}
                    className="px-3.5 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition shadow-2xs shrink-0"
                  >
                    + Adicionar
                  </button>
                </div>
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

          {/* ETAPA 5: Agenda & Horários + Revisão Final */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">
                  Horário Padrão de Funcionamento da Agenda
                </h4>
                <p className="text-xs text-stone-500">
                  Defina os limites de agendamento aplicados aos dias úteis. Você poderá ajustar horários individuais no painel depois.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Horário de Início do Expediente
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
                    Horário de Término do Expediente
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
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Início da Pausa (Almoço/Intervalo)
                  </label>
                  <input
                    type="time"
                    value={formData.breakStart}
                    onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-stone-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Fim da Pausa (Retorno)
                  </label>
                  <input
                    type="time"
                    value={formData.breakEnd}
                    onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-stone-900 transition-all"
                  />
                </div>
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

              {/* Resumo de Confirmação das Credenciais */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 text-xs">
                <span className="font-bold text-stone-900 uppercase tracking-wide text-[10px] block">
                  Resumo da Conta que Será Criada:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700">
                  <p><strong>Proprietário:</strong> {formData.name}</p>
                  <p><strong>E-mail de Login:</strong> {formData.email}</p>
                  <p><strong>Empresa:</strong> {formData.tradeName || 'Não informado'}</p>
                  <p><strong>Segmento:</strong> {currentSegmentConfig.name}</p>
                  <p><strong>Serviços Ativos:</strong> {formData.selectedServices.length}</p>
                  <p><strong>Expediente:</strong> {formData.openTime} às {formData.closeTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 6: Sucesso, Confirmação Real & Acesso */}
          {step === 6 && createdTenantData && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="font-display font-bold text-xl text-stone-900">
                  {createdTenantData.tradeName} Publicado com Sucesso!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
                  Sua empresa e a conta do proprietário foram criadas e persistidas com segurança.
                </p>
              </div>

              {/* Resumo das Credenciais Criadas */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                    Credenciais de Acesso Administrativo
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-stone-700">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Titular da Conta:</span>
                    <span className="font-semibold text-stone-900">{createdTenantData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">E-mail de Login:</span>
                    <span className="font-mono font-semibold text-stone-900">{createdTenantData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Perfil:</span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      Proprietário (Owner)
                    </span>
                  </div>
                </div>
              </div>

              {/* Link público da página de agendamentos */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl max-w-md mx-auto text-left space-y-2">
                <p className="text-xs font-semibold text-stone-700">Link público para suas clientes:</p>
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
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200 text-stone-800 text-xs font-semibold rounded-xl hover:bg-stone-50 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver Página da Cliente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOnboardingOpen(false);
                    setActiveTab('dashboard');
                    setCurrentViewMode('saas');
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors shadow-xs"
                >
                  Ir para o Meu Painel
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
              disabled={isSubmitting}
              onClick={() => {
                setSubmitError(null);
                setStep(step - 1);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          ) : <div />}

          {step === 1 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3">
              <div className="text-xs">
                {!isStep1Valid ? (
                  <div className="flex items-center gap-1.5 text-amber-800 font-medium bg-amber-50/80 px-3 py-1.5 rounded-lg border border-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span className="hidden sm:inline">
                      {step1MissingItems.length === 1 
                        ? `Pendente: ${step1MissingItems[0]}` 
                        : `Preencha os dados do proprietário (${step1MissingItems.length} pendências)`}
                    </span>
                    <span className="sm:hidden">
                      {step1MissingItems.length} {step1MissingItems.length === 1 ? 'campo pendente' : 'campos pendentes'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-800 font-medium bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Segmento e dados do proprietário validados</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleStep1Advance}
                className={`flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer ${
                  isStep1Valid
                    ? 'bg-stone-900 text-white hover:bg-stone-800 ring-2 ring-stone-900/10'
                    : 'bg-stone-800 text-stone-100 hover:bg-stone-900'
                }`}
                title={!isStep1Valid ? 'Preencha os campos obrigatórios para avançar' : 'Avançar para dados do estabelecimento'}
              >
                <span>
                  {formData.businessSegment === 'barber'
                    ? 'Continuar para Dados da Barbearia'
                    : formData.businessSegment === 'nails' || formData.businessSegment === 'beauty'
                    ? 'Continuar para Dados do Salão'
                    : 'Continuar para Dados do Estabelecimento'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <button
              type="button"
              disabled={!isStep2Valid}
              onClick={() => {
                setSubmitError(null);
                setStep(3);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs ml-auto"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step > 2 && step < 5 && (
            <button
              type="button"
              onClick={() => {
                setSubmitError(null);
                setStep(step + 1);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs ml-auto"
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
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md ml-auto"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Gravando e Publicando Empresa...
                </>
              ) : (
                <>
                  Concluir & Publicar Empresa
                  <Check className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              onClick={() => {
                setIsOnboardingOpen(false);
                setActiveTab('dashboard');
                setCurrentViewMode('saas');
              }}
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
