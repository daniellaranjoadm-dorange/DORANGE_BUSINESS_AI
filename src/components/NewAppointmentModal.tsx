import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calendar, Clock, User, Phone, Sparkles, Check, AlertCircle } from 'lucide-react';
import { formatCurrencyBRL, formatPhone } from '../utils/validators';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedDate?: string;
  preselectedTime?: string;
  preselectedProfId?: string;
}

export const NewAppointmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  preselectedDate,
  preselectedTime,
  preselectedProfId,
}) => {
  const { currentTenant, services, professionals, createAppointment } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [serviceId, setServiceId] = useState<string>(services[0]?.id || '');
  const [professionalId, setProfessionalId] = useState<string>(
    preselectedProfId || professionals[0]?.id || ''
  );
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [date, setDate] = useState<string>(preselectedDate || todayStr);
  const [time, setTime] = useState<string>(preselectedTime || '14:00');
  const [isDomicile, setIsDomicile] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');

  React.useEffect(() => {
    if (currentTenant?.id) {
      fetch(`/api/resources?tenantId=${currentTenant.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setResources(data.filter((res: any) => res.active));
        })
        .catch(() => {});
    }
  }, [currentTenant?.id]);

  if (!isOpen) return null;

  const selectedService = services.find((s) => s.id === serviceId) || services[0];
  const selectedProf = professionals.find((p) => p.id === professionalId) || professionals[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName || !customerPhone || !serviceId || !professionalId || !date || !time) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAppointment({
        tenantId: currentTenant?.id,
        serviceId,
        professionalId,
        customerName,
        customerPhone,
        date,
        time,
        notes,
        isDomicile,
        address,
        ...(selectedResourceId ? { resourceId: selectedResourceId } : {}),
      } as any);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-900 text-base">
                Novo Agendamento
              </h3>
              <p className="text-xs text-stone-700">
                {currentTenant?.tradeName} — Validação de horários em tempo real
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Serviço Desejado *
              </label>
              <select
                aria-label="Serviço Desejado"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatCurrencyBRL(s.price)} - {s.durationMinutes}min)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Profissional *
              </label>
              <select
                aria-label="Profissional"
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {resources.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Recurso Compartilhado (Cadeira, Maca ou Sala)
              </label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
              >
                <option value="">Automático / Qualquer disponível</option>
                {resources.map((res: any) => (
                  <option key={res.id} value={res.id}>
                    {res.name} ({res.type === 'chair' ? 'Cadeira' : res.type === 'room' ? 'Sala' : res.type === 'stretcher' ? 'Maca' : 'Equipamento'} — Cap. {res.capacity || 1})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nome da Cliente *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="Nome da cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                WhatsApp da Cliente *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="(51) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Data do Atendimento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Horário de Início *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
              />
            </div>
          </div>

          {currentTenant?.serviceType !== 'establishment' && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDomicile}
                  onChange={(e) => setIsDomicile(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-semibold text-stone-800">
                  Atendimento em Domicílio
                </span>
              </label>
              {isDomicile && (
                <input
                  type="text"
                  placeholder="Endereço da cliente (Rua, nº, complemento, bairro)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg outline-none"
                />
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Observações / Preferências do Atendimento
            </label>
            <input
              type="text"
              placeholder="Ex: preferências, cuidados e referências para o atendimento"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
            />
          </div>

          {/* Resumo do Atendimento */}
          {selectedService && (
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-stone-900">{selectedService.name}</span>
                <span className="text-stone-700 ml-2">({selectedService.durationMinutes} min com {selectedProf?.name})</span>
              </div>
              <span className="font-bold text-amber-900 text-sm tabular-nums">
                {formatCurrencyBRL(selectedService.price)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
            >
              {isSubmitting ? 'Verificando Horário...' : 'Confirmar Agendamento'}
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
