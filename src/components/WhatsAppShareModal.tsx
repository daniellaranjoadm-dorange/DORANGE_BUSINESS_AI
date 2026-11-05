import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment } from '../types';
import { 
  buildConfirmationMessage, 
  buildReminder24hMessage, 
  buildReminder2hMessage, 
  buildCancellationMessage, 
  buildFeedbackMessage, 
  generateWhatsAppLink 
} from '../utils/whatsapp';
import { X, Send, Copy, Check, MessageSquare } from 'lucide-react';

interface Props {
  appointment: Appointment | null;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<Props> = ({ appointment, onClose }) => {
  const { currentTenant, showNotification } = useApp();
  const [templateType, setTemplateType] = useState<
    'confirm' | 'remind_24h' | 'remind_2h' | 'cancel' | 'feedback'
  >('confirm');
  const [copied, setCopied] = useState<boolean>(false);

  if (!appointment || !currentTenant) return null;

  let currentMessage = '';
  switch (templateType) {
    case 'confirm':
      currentMessage = buildConfirmationMessage(appointment, currentTenant);
      break;
    case 'remind_24h':
      currentMessage = buildReminder24hMessage(appointment, currentTenant);
      break;
    case 'remind_2h':
      currentMessage = buildReminder2hMessage(appointment, currentTenant);
      break;
    case 'cancel':
      currentMessage = buildCancellationMessage(appointment, currentTenant);
      break;
    case 'feedback':
      currentMessage = buildFeedbackMessage(appointment, currentTenant);
      break;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    showNotification('Mensagem copiada para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const link = generateWhatsAppLink(appointment.customerPhone, currentMessage);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-900 text-base">
                Enviar Notificação por WhatsApp
              </h3>
              <p className="text-xs text-stone-700">
                Cliente: {appointment.customerName} ({appointment.customerPhone})
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
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Escolha o Modelo de Mensagem:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'confirm', label: 'Confirmação' },
                { id: 'remind_24h', label: 'Lembrete 24h' },
                { id: 'remind_2h', label: 'Lembrete 2h' },
                { id: 'feedback', label: 'Pós-Atendimento' },
                { id: 'cancel', label: 'Cancelamento' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplateType(t.id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    templateType === t.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Prévia do Texto:
            </label>
            <textarea
              readOnly
              rows={8}
              value={currentMessage}
              className="w-full text-xs font-sans p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 leading-relaxed outline-none"
            />
          </div>

          <div className="bg-stone-50 rounded-xl p-3 text-[11px] text-stone-600">
            <strong>Integração WhatsApp:</strong> Para garantir entrega sem risco de bloqueio de conta, oferecemos o envio direto com 1 clique para o WhatsApp da cliente ou conexão com a API oficial do WhatsApp Business.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-xl transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar Texto'}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
            Abrir no WhatsApp da Cliente
          </button>
        </div>

      </div>
    </div>
  );
};
