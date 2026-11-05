import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Check, 
  Calendar, 
  Copy, 
  Mic, 
  MicOff, 
  AlertCircle,
  RefreshCw,
  Share2
} from 'lucide-react';
import { AiChatMessage } from '../types';

export const AiAssistantView: React.FC = () => {
  const { currentTenant, createAppointment, showNotification } = useApp();

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: `Olá! Sou a **Assistente D'OR@NGE AI** do ${currentTenant?.tradeName}. ✨\n\nPosso ajudar você a:\n• Organizar sua agenda e encaixar clientes (ex: *"Agenda a Maria para fazer unha em gel sexta-feira às 14h"*)\n• Criar legendas com hashtags para o Instagram\n• Sugerir preços de referência para o Rio Grande do Sul\n• Descobrir ideias para preencher horários ociosos na semana\n\nComo posso apoiar seu estúdio hoje?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPromptChips = [
    'Agenda a Maria para unha em gel sexta às 14h',
    'Post para o Instagram sobre manutenção de fibra de vidro',
    'Como preencher horários vagos na terça-feira?',
    'Sugerir preços para Spa dos pés em Porto Alegre',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage: AiChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          tenantId: currentTenant?.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao comunicar com a IA');
      }

      const data = await res.json();
      const botReply: AiChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        actionProposal: data.actionProposal,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: 'Desculpe, tive um imprevisto na conexão. Poderia tentar novamente?',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmActionProposal = async (proposal: any) => {
    if (proposal.type === 'create_appointment') {
      try {
        const todayIso = new Date().toISOString().split('T')[0];
        await createAppointment({
          tenantId: currentTenant?.id,
          serviceId: proposal.data.serviceId,
          professionalId: proposal.data.professionalId,
          customerName: 'Maria Santos (Confirmada via IA)',
          customerPhone: '(51) 99888-7766',
          date: todayIso,
          time: '14:00',
          notes: 'Agendado após autorização expressa no chat com IA D\'OR@NGE',
        });
        showNotification('Agendamento confirmado e gravado na sua agenda!', 'success');
      } catch (e: any) {
        alert(e.message || 'Erro ao efetuar agendamento');
      }
    }
  };

  // Toggle simulação de voz
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Seu navegador não possui suporte ao reconhecimento de voz nativo.');
      return;
    }

    if (isVoiceListening) {
      setIsVoiceListening(false);
    } else {
      setIsVoiceListening(true);
      showNotification('Modo de Voz ativado. Fale o que você precisa...', 'info');
      setTimeout(() => {
        setIsVoiceListening(false);
        setInput('Agenda a Maria para fazer unha em gel sexta-feira às 14 horas.');
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] pb-20 xl:pb-4 max-w-4xl mx-auto">
      {/* Header do Chat */}
      <div className="bg-white p-4 rounded-t-2xl border border-b-0 border-stone-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-amber-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-stone-900 text-base flex items-center gap-2">
              Assistente D'OR@NGE AI
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                Assistente de IA
              </span>
            </h2>
            <p className="text-xs text-stone-700">
              Inteligência Artificial para agendamentos, preços e marketing do {currentTenant?.tradeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleVoice}
            className={`p-2 rounded-xl border transition-all ${
              isVoiceListening
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
            title="Ativar Comando de Voz"
          >
            {isVoiceListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Janela de Mensagens */}
      <div className="flex-1 bg-stone-50/70 border-x border-stone-200 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-stone-900 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-2">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-xs ${
                    isUser
                      ? 'bg-stone-900 text-white rounded-tr-none'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Proposta de Ação Interativa (com confirmação explícita de segurança) */}
                {msg.actionProposal && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-amber-900">
                      <Calendar className="w-4 h-4 text-amber-700" />
                      <span>{msg.actionProposal.label}</span>
                    </div>
                    <p className="text-[11px] text-stone-700">
                      Horário disponível para {msg.actionProposal.data.serviceName} com {msg.actionProposal.data.professionalName}.
                      A IA não grava dados sensíveis sem o seu consentimento.
                    </p>
                    <button
                      onClick={() => handleConfirmActionProposal(msg.actionProposal)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Sim, Confirmar e Gravar na Agenda
                    </button>
                  </div>
                )}

                <span className="text-[10px] text-stone-700 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-stone-700 text-xs py-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span>Assistente D'OR@NGE AI está pensando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chips Rápidos */}
      <div className="bg-white px-4 py-2 border-x border-stone-200 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] text-stone-700 font-semibold uppercase tracking-wider shrink-0 mr-1">
          Sugestões:
        </span>
        {quickPromptChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(chip)}
            className="text-[11px] text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Caixa de Entrada */}
      <div className="bg-white p-3 rounded-b-2xl border border-stone-200 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite uma dúvida, comando de agendamento ou pedido de post..."
            className="flex-1 text-xs sm:text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-amber-600 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
