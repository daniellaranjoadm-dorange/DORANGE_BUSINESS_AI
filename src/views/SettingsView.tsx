import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Palette, 
  Clock, 
  MapPin, 
  Save, 
  Check, 
  Building2, 
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Instagram,
  Shield,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { formatPhone } from '../utils/validators';
import { ImageUploader } from '../components/ImageUploader';
import { BUSINESS_SEGMENTS } from '../data/businessSegments';
import { BusinessSegmentId } from '../types';

export const SettingsView: React.FC = () => {
  const { 
    currentTenant, 
    updateTenant, 
    showNotification, 
    exportMyDataLGPD, 
    deleteMyAccountLGPD,
    setCurrentViewMode,
    setPublicBookingSlug,
    currentSegment
  } = useApp();

  const [activeTab, setActiveTab] = useState<'brand' | 'schedule' | 'lgpd'>('brand');

  const [businessSegment, setBusinessSegment] = useState<BusinessSegmentId>(currentTenant?.businessSegment || 'nails');
  const [tradeName, setTradeName] = useState(currentTenant?.tradeName || '');
  const [slug, setSlug] = useState(currentTenant?.slug || '');
  const [logoUrl, setLogoUrl] = useState(currentTenant?.logoUrl || '');
  const [coverUrl, setCoverUrl] = useState(currentTenant?.coverUrl || '');
  const [primaryColor, setPrimaryColor] = useState(currentTenant?.primaryColor || '#17191F');
  const [customColor, setCustomColor] = useState(currentTenant?.primaryColor || '#17191F');
  const [phone, setPhone] = useState(currentTenant?.phone || '');
  const [whatsapp, setWhatsapp] = useState(currentTenant?.whatsapp || '');
  const [instagram, setInstagram] = useState(currentTenant?.instagram || '');
  const [city, setCity] = useState(currentTenant?.city || '');
  const [state, setState] = useState(currentTenant?.state || 'RS');
  const [address, setAddress] = useState(currentTenant?.address || '');
  const [serviceType, setServiceType] = useState(currentTenant?.serviceType || 'both');
  const [description, setDescription] = useState(currentTenant?.description || '');
  const [bufferMinutes, setBufferMinutes] = useState(currentTenant?.bufferBetweenAppointmentsMinutes || 10);
  const [isSaving, setIsSaving] = useState(false);

  const luxuryPalettes = [
    { label: 'Grafite & Mármore (Minimal)', color: '#17191F' },
    { label: 'Ouro D’OR@NGE & Âmbar', color: '#C5A46D' },
    { label: 'Quartzo Rosa & Blush', color: '#BE185D' },
    { label: 'Terracota Nude Aveludado', color: '#9A3412' },
    { label: 'Ametista & Violeta Real', color: '#6B21A8' },
    { label: 'Verde Esmeralda Botânico', color: '#065F46' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    setIsSaving(true);
    try {
      await updateTenant(currentTenant.id, {
        businessSegment,
        tradeName,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        logoUrl: logoUrl || undefined,
        coverUrl: coverUrl || undefined,
        primaryColor,
        phone,
        whatsapp,
        instagram,
        city,
        state,
        address,
        serviceType,
        description,
        bufferBetweenAppointmentsMinutes: bufferMinutes,
      });
      showNotification('Configurações da sua marca atualizadas com sucesso!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Erro ao salvar alterações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenClientPortal = () => {
    if (currentTenant) {
      setPublicBookingSlug(slug || currentTenant.slug);
      setCurrentViewMode('public_booking');
    }
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8 max-w-5xl mx-auto text-[#17191F]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-[#17191F] tracking-tight">
            Marca & Identidade White-Label
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Personalize logotipo, paleta de cores, fotos e horários exclusivos do seu estúdio
          </p>
        </div>

        <button
          onClick={handleOpenClientPortal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-2xs transition self-start sm:self-auto"
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Ver Prévia no Portal</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6E8EC] gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('brand')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'brand'
              ? 'border-stone-900 text-stone-900 font-bold'
              : 'border-transparent text-[#667085] hover:text-[#17191F]'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-700" />
          <span>Identidade Visual & Cores</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'border-stone-900 text-stone-900 font-bold'
              : 'border-transparent text-[#667085] hover:text-[#17191F]'
          }`}
        >
          <Clock className="w-4 h-4 text-stone-600" />
          <span>Localização & Horários</span>
        </button>

        <button
          onClick={() => setActiveTab('lgpd')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'lgpd'
              ? 'border-stone-900 text-stone-900 font-bold'
              : 'border-transparent text-[#667085] hover:text-[#17191F]'
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-700" />
          <span>Privacidade & LGPD</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* ABA 1: IDENTIDADE VISUAL E CORES */}
        {activeTab === 'brand' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coluna de Configuração */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* Cores da Marca */}
              <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-2xs space-y-4">
                <h3 className="font-display font-bold text-sm text-[#17191F]">
                  Paleta de Cores do seu Salão
                </h3>
                <p className="text-xs text-[#667085]">
                  Escolha um tema profissional refinado ou informe a cor exata da sua identidade:
                </p>

                {/* Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {luxuryPalettes.map((p) => {
                    const isSelected = primaryColor === p.color;
                    return (
                      <button
                        type="button"
                        key={p.color}
                        onClick={() => {
                          setPrimaryColor(p.color);
                          setCustomColor(p.color);
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold text-left transition ${
                          isSelected
                            ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 shadow-2xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-[#17191F]'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: p.color }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="truncate text-[11px]">{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Seletor Customizado Hex */}
                <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
                  <label className="text-xs font-semibold text-[#667085]">
                    Cor Personalizada (HEX):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setPrimaryColor(e.target.value);
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-stone-200"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setPrimaryColor(e.target.value);
                      }}
                      className="w-24 text-xs font-mono px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Segmento de Negócio R5 */}
              <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-[#17191F]">
                    Segmento de Atuação da Empresa
                  </h3>
                  <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full font-semibold border border-amber-200">
                    {BUSINESS_SEGMENTS[businessSegment]?.name || 'Manicures'}
                  </span>
                </div>
                <p className="text-xs text-[#667085]">
                  O segmento define a terminologia da sua agenda ({BUSINESS_SEGMENTS[businessSegment]?.terminology.appointmentSingular}), presets de catálogo e inteligência artificial.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {Object.values(BUSINESS_SEGMENTS).map((seg) => {
                    const isSelected = businessSegment === seg.id;
                    return (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => {
                          setBusinessSegment(seg.id);
                          if (seg.id === 'barber' && primaryColor === '#db0677') {
                            setPrimaryColor('#17191F');
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                            : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-800'
                        }`}
                      >
                        <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                          {seg.name.split('&')[0]}
                        </p>
                        <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                          {seg.tagline}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logotipo e Capa com Upload Direto */}
              <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#17191F]">
                    Logomarca & Imagem de Capa (Upload Direto)
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Envie os arquivos diretamente do seu computador ou celular. As imagens serão armazenadas de forma segura e exclusiva para o seu negócio.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Upload de Logomarca */}
                  <ImageUploader
                    label="Logomarca Oficial"
                    currentImageUrl={logoUrl}
                    onImageSaved={(url) => setLogoUrl(url)}
                    aspectRatio="square"
                    type="logo"
                    suggestedWidth={512}
                    suggestedHeight={512}
                    helperText="Aparecerá automaticamente no cabeçalho do portal, comprovantes e materiais de marketing."
                  />

                  {/* Upload de Capa */}
                  <ImageUploader
                    label="Imagem de Capa / Fachada"
                    currentImageUrl={coverUrl}
                    onImageSaved={(url) => setCoverUrl(url)}
                    aspectRatio="banner"
                    type="cover"
                    suggestedWidth={1200}
                    suggestedHeight={400}
                    helperText="Banner visual de destaque exibido no topo da sua página pública de agendamento."
                  />
                </div>
              </div>

              {/* Informações Comerciais */}
              <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-2xs space-y-4">
                <h3 className="font-display font-bold text-sm text-[#17191F]">
                  Nome & Link Exclusivo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#667085] mb-1">
                      Nome Comercial do Salão
                    </label>
                    <input
                      type="text"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#667085] mb-1">
                      Link Público Exclusivo
                    </label>
                    <div className="flex items-center">
                      <span className="text-xs text-[#667085] bg-stone-100 px-3 py-2.5 border border-r-0 border-stone-200 rounded-l-xl">
                        dorange.ai/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="flex-1 text-xs px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-r-xl outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#667085] mb-1">
                    Bio / Descrição do Estabelecimento
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                    placeholder="Descreva suas especialidades e diferencial de atendimento..."
                  />
                </div>
              </div>

            </div>

            {/* Coluna da Direita: Prévia em Tempo Real */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-[#E6E8EC] p-4 shadow-2xs sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                  <span className="font-bold text-xs text-[#17191F] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-700" />
                    Prévia da Página da Cliente
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Ao Vivo
                  </span>
                </div>

                {/* Mockup do Card da Cliente */}
                <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-sm text-xs">
                  <div className="h-28 relative bg-stone-900">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Capa" className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end gap-2">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-white bg-white shrink-0" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 border border-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {tradeName.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                      )}
                      <div className="text-white truncate">
                        <span className="font-bold block text-xs truncate leading-tight">{tradeName || 'Nome do Salão'}</span>
                        <span className="text-[10px] text-stone-200 block truncate">{city} - {state}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 space-y-2 bg-white">
                    <div className="p-2 rounded-xl border border-stone-100 bg-stone-50 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-[11px] block text-stone-900">Alongamento Fibra Slim</span>
                        <span className="text-[10px] text-stone-500">120 minutos</span>
                      </div>
                      <span className="font-bold text-xs" style={{ color: primaryColor }}>R$ 180,00</span>
                    </div>

                    <button
                      type="button"
                      className="w-full py-2 rounded-xl text-white font-bold text-xs transition"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Agendar Horário
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-[#667085] text-center mt-3">
                  Visualização fiel de como as clientes verão seu estúdio no celular.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ABA 2: LOCALIZAÇÃO E ATENDIMENTO */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-3xl border border-[#E6E8EC] p-6 shadow-2xs space-y-5">
            <h3 className="font-display font-bold text-sm text-[#17191F]">
              Endereço Físico & Políticas de Agendamento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#667085] mb-1">
                  WhatsApp Oficial para Confirmações
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatPhone(e.target.value));
                    setWhatsapp(formatPhone(e.target.value));
                  }}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#667085] mb-1">
                  Perfil no Instagram (@seu.studio)
                </label>
                <input
                  type="text"
                  placeholder="@seunegocio"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#667085] mb-1">
                  Endereço do Estabelecimento
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  placeholder="Rua, número, bairro e sala"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#667085] mb-1">
                  Cidade e UF
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-14 text-center text-xs px-2 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#667085] mb-1">
                Intervalo de Biossegurança entre Atendimentos (Higienização)
              </label>
              <div className="flex gap-2">
                {[0, 10, 15, 20].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setBufferMinutes(mins)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                      bufferMinutes === mins
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 text-[#667085] hover:bg-stone-50'
                    }`}
                  >
                    {mins === 0 ? 'Sem intervalo' : `${mins} minutos`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: PRIVACIDADE & LGPD */}
        {activeTab === 'lgpd' && (
          <div className="bg-white rounded-3xl border border-[#E6E8EC] p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-display font-bold text-sm text-[#17191F]">
                  Conformidade LGPD & Gestão de Dados
                </h3>
                <p className="text-xs text-[#667085]">
                  Seus direitos fundamentais sob a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl border border-stone-200 bg-[#F8F9FB] space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-stone-900">
                  <Download className="w-4 h-4 text-stone-700" />
                  <span>Exportabilidade de Dados</span>
                </div>
                <p className="text-xs text-[#667085]">
                  Baixe cópia completa de todos os seus dados cadastrais, clientes, histórico financeiro e agendamentos em formato portátil JSON.
                </p>
                <button
                  type="button"
                  onClick={exportMyDataLGPD}
                  className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-800 transition"
                >
                  Exportar Meus Dados (JSON)
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Direito ao Esquecimento & Exclusão</span>
                </div>
                <p className="text-xs text-rose-800">
                  Solicite a exclusão total da conta do salão e remoção irreversível de todos os registros armazenados.
                </p>
                <button
                  type="button"
                  onClick={deleteMyAccountLGPD}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition shadow-2xs"
                >
                  Excluir Minha Conta Definitivamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botão de Salvar Alterações */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition shadow-2xs"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{isSaving ? 'Salvando Alterações...' : 'Salvar Alterações da Minha Marca'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
