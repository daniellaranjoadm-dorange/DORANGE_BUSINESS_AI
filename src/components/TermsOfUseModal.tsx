import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantName?: string;
}

export const TermsOfUseModal: React.FC<TermsOfUseModalProps> = ({ isOpen, onClose, tenantName = "D'OR@NGE BUSINESS AI" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display">Termos e Condições de Uso</h2>
              <p className="text-xs text-stone-300">Regulamento dos serviços e agendamentos</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-stone-700 text-xs sm:text-sm leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Tecnologia White-Label:</strong>
              O ambiente de agendamento pertence a <strong>{tenantName}</strong>, operando sobre a infraestrutura tecnológica D'OR@NGE BUSINESS AI.
            </div>
          </div>

          <section>
            <h3 className="text-stone-900 font-bold mb-1">1. Política de Agendamento e Pontualidade</h3>
            <p className="text-stone-600">
              Os horários reservados são dedicados exclusivamente ao cliente. Recomendamos a chegada com 5 a 10 minutos de antecedência. Tolera-se até 10 minutos de atraso, após o qual o atendimento poderá ser adaptado ou remarcado para não comprometer a cliente seguinte.
            </p>
          </section>

          <section>
            <h3 className="text-stone-900 font-bold mb-1">2. Cancelamentos e Reagendamentos</h3>
            <p className="text-stone-600">
              O cancelamento ou remarcação deve ser realizado com antecedência mínima de 2 horas através do link do portal ou contato direto com a profissional. Em caso de sinal de reserva (Pix), o reembolso seguirá as diretrizes individuais do salão contratado.
            </p>
          </section>

          <section>
            <h3 className="text-stone-900 font-bold mb-1">3. Pacotes Pré-pagos e Cartão Fidelidade</h3>
            <p className="text-stone-600">
              Pacotes de sessões adquiridos possuem validade informada na data da compra (geralmente de 60 a 90 dias) e são pessoais e intransferíveis, salvo acordo expresso com o salão. Pontos de fidelidade são creditados após a conclusão de cada procedimento pago.
            </p>
          </section>

          <section>
            <h3 className="text-stone-900 font-bold mb-1">4. Direitos de Imagem dos Trabalhos</h3>
            <p className="text-stone-600">
              Fotos dos trabalhos realizados poderão ser publicadas no portfólio digital e redes sociais apenas com o consentimento prévio e sem exibir o rosto ou informações identificáveis do cliente, salvo autorização voluntária.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
