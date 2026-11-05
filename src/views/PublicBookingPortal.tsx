import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Tenant, Service, Professional, PortfolioItem } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Phone, 
  Check, 
  Sparkles, 
  ChevronLeft, 
  ArrowRight, 
  Send, 
  ExternalLink, 
  ShieldCheck, 
  Image as ImageIcon,
  Heart,
  Award,
  AlertCircle,
  Instagram,
  CheckCircle2,
  Info
} from 'lucide-react';
import { formatCurrencyBRL, formatDateBR, formatPhone } from '../utils/validators';
import { buildConfirmationMessage, generateWhatsAppLink } from '../utils/whatsapp';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';
import { TermsOfUseModal } from '../components/TermsOfUseModal';

export const PublicBookingPortal: React.FC = () => {
  const { 
    tenants, 
    publicBookingSlug, 
    createAppointment, 
    setCurrentViewMode,
    portfolio
  } = useApp();

  const [publicPortfolio, setPublicPortfolio] = useState<any[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantServices, setTenantServices] = useState<Service[]>([]);
  const [tenantProfessionals, setTenantProfessionals] = useState<Professional[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Tab view inside public portal: 'booking' | 'gallery' | 'about'
  const [portalTab, setPortalTab] = useState<'booking' | 'gallery' | 'about'>('booking');

  // Legal modals
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Booking Wizard Steps:
  // 1: Service selection
  // 2: Professional selection
  // 3: Date & Time
  // 4: Customer Details & Inspiration Photo
  // 5: Confirmation & WhatsApp
  const [step, setStep] = useState<number>(1);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [inspirationPhotoUrl, setInspirationPhotoUrl] = useState<string>('');
  const [isDomicile, setIsDomicile] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carrega dados da empresa baseado no slug
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response=await fetch(`/api/public/booking/${encodeURIComponent(publicBookingSlug)}?date=${selectedDate}`);
        if(!response.ok)throw Error('Estabelecimento não encontrado');
        const data=await response.json();setTenant(data.tenant);setTenantServices(data.services);setTenantProfessionals(data.professionals);setPublicPortfolio(data.portfolio);
        if(data.professionals.length)setSelectedProf(data.professionals[0]);
        setBookedSlots(data.appointments.filter((a:any)=>!selectedProf||a.professionalId===selectedProf.id).map((a:any)=>a.time));
      } catch (err) {
        setErrorMessage('Estabelecimento não encontrado ou indisponível.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [publicBookingSlug, tenants, selectedDate]);

  // Lista de horários disponíveis
  const availableSlots = [
    '09:00', '09:40', '10:30', '11:15', '13:30', '14:20', '15:10', '16:00', '17:00', '18:00', '18:45'
  ];

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !selectedService || !selectedProf || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      setErrorMessage('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const app = await createAppointment({
        tenantId: tenant.id,
        serviceId: selectedService.id,
        professionalId: selectedProf.id,
        customerName,
        customerPhone,
        date: selectedDate,
        time: selectedTime,
        isDomicile,
        address,
        notes,
        inspirationPhotoUrl: inspirationPhotoUrl || undefined
      });

      setConfirmedAppointment(app);
      setStep(5);
    } catch (err: any) {
      setErrorMessage(err.message || 'Horário indisponível ou em conflito na agenda. Por favor selecione outro horário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryCol = tenant?.primaryColor || '#17191F';

  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#667085]">{errorMessage || "Acessando estabelecimento…"}</p>
        </div>
      </div>
    );
  }

  const monogram = tenant.tradeName.slice(0, 2).toUpperCase();
  const tenantPortfolio = publicPortfolio;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center p-0 sm:py-8 sm:px-4 font-sans text-[#17191F]">
      
      {/* Barra de Controle de Pré-visualização (Discreta, no topo) */}
      <div className="w-full max-w-xl px-4 py-2 flex items-center justify-between text-xs text-[#667085]">
        <button
          onClick={() => setCurrentViewMode('saas')}
          className="flex items-center gap-1 font-semibold hover:text-[#17191F] transition bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-200"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel da Profissional</span>
        </button>
        <span className="text-[10px] font-mono text-stone-500">
          {tenant.slug}.dorange.ai
        </span>
      </div>

      {/* Cartão Mobile-First do Studio */}
      <div className="w-full max-w-xl bg-white sm:rounded-3xl shadow-xl border border-[#E6E8EC] overflow-hidden flex flex-col min-h-screen sm:min-h-0">
        
        {/* Capa & Logomarca do Studio */}
        <div className="relative h-48 sm:h-56 w-full bg-stone-900 overflow-hidden">
          {tenant.coverUrl ? (
            <img
              src={tenant.coverUrl}
              alt={tenant.tradeName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-85"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/30 to-transparent" />

          {/* Logo e Nome do Estabelecimento */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3.5">
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.tradeName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-white shrink-0"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display font-bold text-xl shadow-md border-2 border-white shrink-0"
                style={{ backgroundColor: primaryCol }}
              >
                {monogram}
              </div>
            )}

            <div className="text-white">
              <h1 className="font-display font-bold text-lg sm:text-xl leading-tight text-white drop-shadow-xs">
                {tenant.tradeName}
              </h1>
              <p className="text-xs text-stone-200 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#C5A46D]" />
                <span>{tenant.city} - {tenant.state} · Atendimento com Hora Marcada</span>
              </p>
            </div>
          </div>
        </div>

        {/* Abas de Navegação do Portal */}
        <div className="flex border-b border-[#E6E8EC] bg-[#F8F9FB] text-xs font-semibold">
          <button
            onClick={() => setPortalTab('booking')}
            className={`flex-1 py-3 transition flex items-center justify-center gap-1.5 border-b-2 ${
              portalTab === 'booking'
                ? 'border-stone-900 text-stone-900 bg-white font-bold'
                : 'border-transparent text-[#667085] hover:text-stone-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
            <span>Agendamento</span>
          </button>

          <button
            onClick={() => setPortalTab('gallery')}
            className={`flex-1 py-3 transition flex items-center justify-center gap-1.5 border-b-2 ${
              portalTab === 'gallery'
                ? 'border-stone-900 text-stone-900 bg-white font-bold'
                : 'border-transparent text-[#667085] hover:text-stone-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>Galeria ({tenantPortfolio.length})</span>
          </button>

          <button
            onClick={() => setPortalTab('about')}
            className={`flex-1 py-3 transition flex items-center justify-center gap-1.5 border-b-2 ${
              portalTab === 'about'
                ? 'border-stone-900 text-stone-900 bg-white font-bold'
                : 'border-transparent text-[#667085] hover:text-stone-900'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-stone-500" />
            <span>Sobre</span>
          </button>
        </div>

        {/* TAB 1: GALERIA DE TRABALHOS */}
        {portalTab === 'gallery' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-[#17191F]">Portfólio de Trabalhos</h2>
                <p className="text-xs text-[#667085]">Designs exclusivos e aplicações realizadas no estúdio</p>
              </div>
              <button
                onClick={() => setPortalTab('booking')}
                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
              >
                Agendar Agora
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {tenantPortfolio.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#E6E8EC] overflow-hidden bg-white shadow-2xs">
                  <div className="relative aspect-square">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                      <span>{item.likes}</span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-bold text-xs text-[#17191F] truncate">{item.title}</h3>
                    <p className="text-[10px] text-amber-800 font-medium">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>

            {tenantPortfolio.length === 0 && (
              <div className="text-center py-8 text-[#667085] text-xs">
                Novas fotos de trabalhos serão adicionadas em breve.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SOBRE O ESTÚDIO */}
        {portalTab === 'about' && (
          <div className="p-5 space-y-4 text-xs leading-relaxed text-[#667085]">
            <div className="space-y-1">
              <h2 className="font-display font-bold text-base text-[#17191F]">{tenant.tradeName}</h2>
              <p className="text-xs text-stone-700">{tenant.description || 'Atendimento personalizado para você.'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <MapPin className="w-4 h-4 text-amber-700" />
                <span>Localização & Atendimento</span>
              </div>
              <p className="text-stone-700">
                {tenant.address ? tenant.address : `${tenant.city} - ${tenant.state}`}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 font-semibold text-[10px]">
                  {tenant.serviceType === 'establishment' ? 'Atendimento no Estúdio' : tenant.serviceType === 'domicile' ? 'Atendimento a Domicílio' : 'Estúdio e Domicílio'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Contato Direto</span>
              </div>
              <p className="text-stone-700">
                WhatsApp: {tenant.whatsapp || tenant.phone}
              </p>
              {tenant.instagram && (
                <p className="text-stone-700">
                  Instagram: @{tenant.instagram.replace('@', '')}
                </p>
              )}
            </div>

            <button
              onClick={() => setPortalTab('booking')}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs"
            >
              Escolher Serviço e Agendar
            </button>
          </div>
        )}

        {/* TAB 3: AGENDAMENTO WIZARD */}
        {portalTab === 'booking' && (
          <>
            {/* Indicador de Etapas */}
            {step < 5 && (
              <div className="px-5 py-2.5 border-b border-stone-100 flex items-center justify-between text-xs bg-stone-50/70">
                <span className="font-semibold text-stone-800">
                  {step === 1 && '1. Procedimento'}
                  {step === 2 && '2. Especialista'}
                  {step === 3 && '3. Data & Horário'}
                  {step === 4 && '4. Seus Dados'}
                </span>
                <span className="text-[11px] text-[#667085] font-medium">
                  Etapa {step} de 4
                </span>
              </div>
            )}

            {/* Conteúdo das Etapas */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto">

              {/* ETAPA 1: Catálogo de Serviços */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="font-display font-bold text-base text-[#17191F]">
                      Selecione o procedimento:
                    </h2>
                    <p className="text-xs text-[#667085]">
                      Valores e duração média dos atendimentos
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {tenantServices.filter((s) => s.active).map((service) => {
                      const isSelected = selectedService?.id === service.id;
                      return (
                        <div
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 shadow-2xs'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {service.imageUrl && (
                              <img
                                src={service.imageUrl}
                                alt={service.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-display font-bold text-xs text-[#17191F]">
                                  {service.name}
                                </span>
                                {service.isPopular && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                                    Destaque
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#667085] mt-0.5 line-clamp-1">
                                {service.description}
                              </p>
                              <span className="text-[10px] text-[#667085] flex items-center gap-1 mt-1 font-medium">
                                <Clock className="w-3 h-3 text-stone-400" />
                                {service.durationMinutes} minutos
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-sm text-[#17191F] tabular-nums">
                              {formatCurrencyBRL(service.price)}
                            </span>
                            <div className={`w-5 h-5 rounded-full border mt-1.5 ml-auto flex items-center justify-center ${
                              isSelected ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ETAPA 2: Escolha de Profissional */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="font-display font-bold text-base text-[#17191F]">
                      Com quem você deseja realizar o atendimento?
                    </h2>
                    <p className="text-xs text-[#667085]">
                      Nossas especialistas credenciadas no {tenant.tradeName}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {tenantProfessionals.map((prof) => {
                      const isSelected = selectedProf?.id === prof.id;
                      return (
                        <div
                          key={prof.id}
                          onClick={() => setSelectedProf(prof)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-2xs"
                              style={{ backgroundColor: primaryCol }}
                            >
                              {prof.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-display font-bold text-sm text-[#17191F]">
                                {prof.name}
                              </h4>
                              <p className="text-xs text-amber-800 font-medium">
                                {prof.role}
                              </p>
                              {prof.bio && (
                                <p className="text-[11px] text-[#667085] mt-0.5 line-clamp-1">
                                  {prof.bio}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ETAPA 3: Data e Horário */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="font-display font-bold text-base text-[#17191F]">
                      Escolha o dia e horário:
                    </h2>
                    <p className="text-xs text-[#667085]">
                      Horários validados para evitar esperas
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Data do Procedimento
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full text-xs font-medium px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Horários Disponíveis com {selectedProf?.name}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = selectedTime === slot;

                        return (
                          <button
                            type="button"
                            key={slot}
                            disabled={isBooked}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 px-1 text-xs rounded-xl font-semibold transition-all tabular-nums ${
                              isBooked
                                ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-stone-900 text-white shadow-2xs font-bold'
                                : 'bg-stone-50 text-stone-800 border border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 4: Dados da Cliente + Foto de Inspiração */}
              {step === 4 && (
                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="font-display font-bold text-base text-[#17191F]">
                      Quase pronto! Informe seus dados:
                    </h2>
                    <p className="text-xs text-[#667085]">
                      Enviaremos os detalhes e lembrete direto no seu WhatsApp
                    </p>
                  </div>

                  {/* Benefício de Fidelidade */}
                  {tenant.loyaltyProgramEnabled && (
                    <div className="p-3 bg-[#F8F9FB] border border-[#E6E8EC] rounded-2xl flex items-center gap-2.5 text-xs text-stone-800">
                      <Award className="w-5 h-5 text-amber-700 shrink-0" />
                      <div>
                        <strong className="block font-semibold">Fidelidade {tenant.tradeName}:</strong>
                        <span>Você acumulará cerca de {Math.floor((selectedService?.price || 0) * (tenant.loyaltyPointsPerReal || 1))} pontos com este agendamento!</span>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Amanda Ferreira"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Seu WhatsApp com DDD *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(51) 99999-9999"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                    />
                  </div>

                  {/* Referência ou Inspiração de Unhas */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Foto de Inspiração ou Referência (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="Cole o link da foto de referência (Pinterest, Instagram ou imagem)"
                      value={inspirationPhotoUrl}
                      onChange={(e) => setInspirationPhotoUrl(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                    />
                    {inspirationPhotoUrl && (
                      <div className="mt-2 w-16 h-16 rounded-xl border border-stone-300 overflow-hidden">
                        <img src={inspirationPhotoUrl} alt="Inspiração" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Resumo da Reserva */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs space-y-1.5">
                    <span className="font-bold text-stone-900 block text-xs uppercase tracking-wider">
                      Resumo da sua Reserva:
                    </span>
                    <div className="flex justify-between text-stone-600">
                      <span>Procedimento:</span>
                      <span className="font-semibold text-stone-900">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Profissional:</span>
                      <span className="font-semibold text-stone-900">{selectedProf?.name}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Data e Horário:</span>
                      <span className="font-semibold text-stone-900">{formatDateBR(selectedDate)} às {selectedTime}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-stone-200 text-sm font-bold text-stone-900">
                      <span>Valor:</span>
                      <span className="text-amber-900">{formatCurrencyBRL(selectedService?.price || 0)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Confirmando no Sistema...' : 'Confirmar Meu Agendamento'}
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </form>
              )}

              {/* ETAPA 5: Sucesso & Confirmação com WhatsApp */}
              {step === 5 && confirmedAppointment && (
                <div className="text-center py-6 space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-xl text-[#17191F]">
                      Agendamento Confirmado!
                    </h3>
                    <p className="text-xs text-[#667085] max-w-sm mx-auto">
                      Seu horário foi reservado com sucesso no <strong>{tenant.tradeName}</strong>.
                    </p>
                  </div>

                  {/* Box de Confirmação */}
                  <div className="bg-[#F8F9FB] border border-[#E6E8EC] rounded-2xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Cliente:</span>
                      <span className="font-bold text-[#17191F]">{confirmedAppointment.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Procedimento:</span>
                      <span className="font-bold text-[#17191F]">{confirmedAppointment.serviceName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Data & Horário:</span>
                      <span className="font-bold text-[#17191F]">{formatDateBR(confirmedAppointment.date)} às {confirmedAppointment.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Especialista:</span>
                      <span className="font-bold text-[#17191F]">{confirmedAppointment.professionalName}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-stone-200 font-bold text-base text-[#17191F]">
                      <span>Valor:</span>
                      <span className="text-amber-900">{formatCurrencyBRL(confirmedAppointment.price)}</span>
                    </div>
                  </div>

                  {/* Botão de Confirmação no WhatsApp */}
                  <button
                    onClick={() => {
                      const msg = buildConfirmationMessage(confirmedAppointment, tenant);
                      const link = generateWhatsAppLink(tenant.whatsapp || tenant.phone, msg);
                      window.open(link, '_blank');
                    }}
                    className="w-full max-w-md mx-auto py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Abrir Confirmação no WhatsApp</span>
                  </button>
                </div>
              )}

            </div>

            {/* Footer do Wizard da Cliente */}
            {step > 1 && step < 4 && (
              <div className="p-4 border-t border-stone-100 bg-[#F8F9FB] flex items-center justify-between">
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-xs font-semibold text-[#667085] hover:text-[#17191F] flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>

                <button
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 1 && !selectedService) || (step === 2 && !selectedProf) || (step === 3 && !selectedTime)}
                  className="px-5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-xl transition flex items-center gap-1"
                >
                  Avançar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="p-4 border-t border-stone-100 bg-[#F8F9FB] flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedService}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-xl transition flex items-center gap-1 shadow-2xs"
                >
                  Continuar com este Serviço
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Rodapé White-Label com Termos & Privacidade LGPD */}
        <div className="p-4 bg-[#F8F9FB] border-t border-[#E6E8EC] text-center space-y-1.5">
          <p className="text-[11px] text-[#17191F] font-semibold">
            {tenant.tradeName} · Atendimento Exclusivo com Hora Marcada
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] text-[#667085]">
            <button 
              onClick={() => setIsTermsOpen(true)}
              className="hover:underline hover:text-stone-900"
            >
              Termos de Uso
            </button>
            <span>•</span>
            <button 
              onClick={() => setIsPrivacyOpen(true)}
              className="hover:underline hover:text-stone-900"
            >
              Privacidade & LGPD
            </button>
          </div>
          <p className="text-[9px] uppercase tracking-wider text-[#667085]/80">
            Tecnologia White-Label por D'OR@NGE
          </p>
        </div>

      </div>

      {/* Modais Legais */}
      <PrivacyPolicyModal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
        tenantName={tenant.tradeName} 
      />
      <TermsOfUseModal 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
        tenantName={tenant.tradeName} 
      />
    </div>
  );
};
