import React from 'react';
import { X, Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantName?: string;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose, tenantName = "D'OR@NGE BUSINESS AI" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-stone-900">Política de Privacidade & LGPD</h2>
              <p className="text-xs text-stone-600">Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-700 text-xs sm:text-sm leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Compromisso com a sua privacidade:</strong>
              Esta plataforma atua em conformidade estrita com a LGPD e garante que seus dados são utilizados unicamente para a prestação de serviços de estética, agendamentos e comunicação consentida.
            </div>
          </div>

          <section>
            <h3 className="text-stone-900 font-bold mb-1.5 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-600" /> 1. Dados Coletados e Finalidade
            </h3>
            <p>
              Ao utilizar os serviços de <strong>{tenantName}</strong> através da tecnologia D'OR@NGE BUSINESS AI, coletamos:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-stone-600">
              <li><strong>Clientes:</strong> Nome completo, telefone/WhatsApp, preferências e referências do atendimento para fins de confirmação e personalização do atendimento.</li>
              <li><strong>Profissionais & Salões:</strong> CPF/CNPJ, dados cadastrais, horários de atendimento e histórico financeiro para operacionalização da agenda multiempresa.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-stone-900 font-bold mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-600" /> 2. Não Compartilhamento e Sigilo
            </h3>
            <p>
              Seus dados nunca são vendidos ou alugados para terceiros. O salão ou profissional contratado é o controlador dos seus dados no âmbito do atendimento, e a D'OR@NGE opera como operadora tecnológica sob rigoroso isolamento multi-tenant (seus dados não são acessíveis por outros salões da plataforma).
            </p>
          </section>

          <section>
            <h3 className="text-stone-900 font-bold mb-1.5 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-600" /> 3. Seus Direitos (Art. 18 da LGPD)
            </h3>
            <p>
              Você pode a qualquer momento:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-stone-600">
              <li>Solicitar a confirmação da existência de tratamento e o acesso aos seus dados;</li>
              <li>Solicitar a correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Exportar seus dados em formato portátil (JSON/CSV) diretamente pelo painel;</li>
              <li>Solicitar a eliminação completa dos dados pessoais tratados com consentimento.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-stone-900 font-bold mb-1.5">4. Comunicações via WhatsApp</h3>
            <p className="text-stone-600">
              As mensagens automáticas e lembretes de horário são enviados com base na sua solicitação expressa de agendamento. Não praticamos disparos em massa não solicitados (SPAM).
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
          >
            Compreendi e Concordo
          </button>
        </div>
      </div>
    </div>
  );
};
