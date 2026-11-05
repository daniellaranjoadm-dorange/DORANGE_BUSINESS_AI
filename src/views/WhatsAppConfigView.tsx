import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MessageSquare, 
  Smartphone, 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Send, 
  ExternalLink,
  HelpCircle,
  Copy
} from 'lucide-react';
import { formatPhone } from '../utils/validators';

export const WhatsAppConfigView: React.FC = () => {
  const { currentTenant, updateWhatsAppConfig, showNotification } = useApp();

  const [mode, setMode] = useState<'personal' | 'business_platform'>(
    currentTenant?.whatsappMode || 'personal'
  );

  // Campos do WhatsApp Business Platform (Meta Cloud API)
  const [phoneNumberId, setPhoneNumberId] = useState(
    currentTenant?.whatsappCloudApiConfig?.phoneNumberId || ''
  );
  const [wabaId, setWabaId] = useState(
    currentTenant?.whatsappCloudApiConfig?.wabaId || ''
  );
  const [accessToken, setAccessToken] = useState(
    currentTenant?.whatsappCloudApiConfig?.accessToken || ''
  );
  const [webhookVerifyToken, setWebhookVerifyToken] = useState(
    currentTenant?.whatsappCloudApiConfig?.webhookVerifyToken || 'dorange_webhook_verify_secret'
  );

  const [testNumber, setTestNumber] = useState(currentTenant?.whatsapp || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateWhatsAppConfig(mode, {
        phoneNumberId,
        wabaId,
        accessToken,
        webhookVerifyToken,
        status: mode === 'business_platform' && phoneNumberId && accessToken ? 'connected' : 'disconnected',
      });
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configuração.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestManualLink = () => {
    const text = `Olá! Mensagem de teste do sistema de agendamento ${currentTenant?.tradeName}.`;
    const clean = (testNumber || currentTenant?.whatsapp || '').replace(/\D/g, '');
    const url = `https://wa.me/55${clean}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-stone-900 text-xl sm:text-2xl flex items-center gap-2">
          Central de Configuração de WhatsApp
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
            Pessoal & Business
          </span>
        </h1>
        <p className="text-xs text-stone-700">
          Escolha entre o WhatsApp Pessoal (com links manuais sem risco de bloqueio) ou a API Oficial da Meta (WhatsApp Business Platform)
        </p>
      </div>

      {/* Seletor de Modo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setMode('personal')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            mode === 'personal'
              ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600 shadow-xs'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-900 text-sm">
                WhatsApp Pessoal / Business App
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                Sem custos de API · 100% Seguro
              </span>
            </div>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Utiliza links diretos <code className="text-stone-800 font-mono">wa.me</code> e modelos de texto autorizados. Abre diretamente no aplicativo WhatsApp instalado no seu celular ou no WhatsApp Web. Não corre nenhum risco de bloqueio.
          </p>
        </div>

        <div
          onClick={() => setMode('business_platform')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            mode === 'business_platform'
              ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600 shadow-xs'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-900 text-sm">
                WhatsApp Business Platform (API Oficial Meta)
              </h3>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                Disparo Automático · Requer Meta Cloud
              </span>
            </div>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Integração por Cloud API oficial com autenticação por Token e Webhook. Permite envio 100% automatizado de lembretes e confirmações com templates aprovados pela Meta.
          </p>
        </div>
      </div>

      {/* Configurações do Modo Selecionado */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
        
        {mode === 'personal' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-display font-bold text-stone-900 text-sm">
                Configuração do WhatsApp Pessoal
              </h3>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Operacional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Número de WhatsApp do Salão com DDD *
                </label>
                <input
                  type="text"
                  required
                  value={testNumber}
                  onChange={(e) => setTestNumber(formatPhone(e.target.value))}
                  placeholder="(51) 99876-5432"
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Link Direto de Contato
                </label>
                <input
                  readOnly
                  value={`https://wa.me/55${testNumber.replace(/\D/g, '')}`}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl outline-none font-mono text-stone-600"
                />
              </div>
            </div>

            {/* Teste Imediato */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-stone-900">Testar Abertura do WhatsApp</p>
                <p className="text-[11px] text-stone-600">
                  Clique para abrir seu WhatsApp com a mensagem oficial formatada do {currentTenant?.tradeName}
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestManualLink}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Testar Envio
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-display font-bold text-stone-900 text-sm">
                Credenciais da Meta Cloud API (WhatsApp Business Platform)
              </h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                currentTenant?.whatsappCloudApiConfig?.status === 'connected'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {currentTenant?.whatsappCloudApiConfig?.status === 'connected' ? 'API Ativa' : 'Pendente de Configuração'}
              </span>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">Atenção sobre conformidade:</p>
              <p>
                A integração com a WhatsApp Business Platform oficial exige conta empresarial verificada no Meta Business Manager. Enquanto não houver credenciais reais fornecidas pela Meta, a plataforma D'OR@NGE continuará utilizando o modo WhatsApp Pessoal para garantir que você não perca nenhum agendamento.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Phone Number ID (Meta for Developers)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 104598234891234"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  WhatsApp Business Account ID (WABA ID)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 984512398451234"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Permanent Access Token (Meta System User Token)
              </label>
              <input
                type="password"
                placeholder="EAA..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Webhook Verify Token
              </label>
              <input
                type="text"
                value={webhookVerifyToken}
                onChange={(e) => setWebhookVerifyToken(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none font-mono"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-3 border-t border-stone-100">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando Configuração...' : 'Salvar Configurações de WhatsApp'}
          </button>
        </div>

      </form>
    </div>
  );
};
