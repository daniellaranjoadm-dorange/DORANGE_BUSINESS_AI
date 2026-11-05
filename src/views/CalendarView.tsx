import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Ban,
  Filter,
  UserX,
  RefreshCw,
  Lock,
  Trash2,
  ListOrdered,
  X,
  CalendarCheck2
} from 'lucide-react';
import { formatCurrencyBRL, formatDateBR } from '../utils/validators';
import { NewAppointmentModal } from '../components/NewAppointmentModal';
import { WhatsAppShareModal } from '../components/WhatsAppShareModal';
import { Appointment } from '../types';

export const CalendarView: React.FC = () => {
  const { 
    currentTenant, 
    appointments, 
    professionals, 
    updateAppointmentStatus,
    rescheduleAppointment,
    recordNoShow,
    blockedTimes,
    createBlockedTime,
    deleteBlockedTime,
    waitingList,
    addToWaitingList,
    showNotification
  } = useApp();

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedProfId, setSelectedProfId] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>(undefined);
  const [selectedAppForWhatsApp, setSelectedAppForWhatsApp] = useState<Appointment | null>(null);

  // Modais R4: Reagendamento, Bloqueio de Horário e Fila de Espera
  const [reschedulingApp, setReschedulingApp] = useState<Appointment | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>('');
  const [newRescheduleTime, setNewRescheduleTime] = useState<string>('14:00');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState<boolean>(false);
  const [blockReason, setBlockReason] = useState<string>('Compromisso médico / Intervalo');
  const [blockStartTime, setBlockStartTime] = useState<string>('12:00');
  const [blockEndTime, setBlockEndTime] = useState<string>('13:30');
  const [waitCustomerName, setWaitCustomerName] = useState<string>('');
  const [waitCustomerPhone, setWaitCustomerPhone] = useState<string>('');
  const [waitServiceName, setWaitServiceName] = useState<string>('Alongamento ou Esmaltação');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentDateStr = currentDate.toISOString().split('T')[0];

  // Filtra agendamentos
  const filteredAppointments = appointments.filter((a) => {
    if (selectedProfId !== 'all' && a.professionalId !== selectedProfId) return false;
    return a.date === currentDateStr;
  });

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Grade de horários padrão das 08:00 às 20:00 em intervalos de 30 minutos
  const timeSlots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    const hourStr = h < 10 ? `0${h}` : `${h}`;
    timeSlots.push(`${hourStr}:00`);
    if (h < 20) timeSlots.push(`${hourStr}:30`);
  }

  const handleSlotClick = (slot: string) => {
    setSelectedTimeSlot(slot);
    setIsNewModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-20 xl:pb-8">
      {/* Top Controls: Navegação de Datas & Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Seletor de Data */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            Hoje
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevDay}
              className="p-1.5 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-display font-bold text-stone-900 text-base sm:text-lg min-w-[140px] text-center">
              {formatDateBR(currentDateStr)}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1.5 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtros e Novo Horário */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de Profissional */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              aria-label="Filtrar por Profissional"
              value={selectedProfId}
              onChange={(e) => setSelectedProfId(e.target.value)}
              className="text-xs font-medium px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg outline-none"
            >
              <option value="all">Todas as Profissionais</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bloquear Horário */}
          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl transition"
            title="Bloquear intervalo na agenda"
          >
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span>Bloquear</span>
          </button>

          {/* Fila de Espera */}
          <button
            onClick={() => setIsWaitingListModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl transition relative"
            title="Fila de espera de clientes"
          >
            <ListOrdered className="w-3.5 h-3.5 text-amber-700" />
            <span>Fila de Espera</span>
            {waitingList.filter((w) => w.desiredDate === currentDateStr).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                {waitingList.filter((w) => w.desiredDate === currentDateStr).length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setSelectedTimeSlot(undefined);
              setIsNewModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition shadow-2xs ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Grade de Horários */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-stone-900">
              Grade de Atendimentos — {formatDateBR(currentDateStr)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-600 font-medium">
            <span>{filteredAppointments.length} agendamento(s)</span>
            <span>•</span>
            <span className="text-amber-800 font-semibold">
              {blockedTimes.filter((b) => b.date === currentDateStr).length} bloqueio(s)
            </span>
          </div>
        </div>

        <div className="divide-y divide-stone-100">
          {timeSlots.map((slot) => {
            const matchedApp = filteredAppointments.find((a) => a.time === slot);

            // Verifica se este horário está bloqueado explicitamente
            const matchedBlock = blockedTimes.find((b) => {
              if (b.date !== currentDateStr) return false;
              if (selectedProfId !== 'all' && b.professionalId !== selectedProfId) return false;
              return b.startTime <= slot && b.endTime > slot;
            });

            const isLunchTime = (slot === '12:30' || slot === '13:00') && !matchedBlock && !matchedApp;

            return (
              <div
                key={slot}
                className="flex items-stretch min-h-[52px] hover:bg-stone-50/70 transition-colors group"
              >
                {/* Coluna de Horário */}
                <div className="w-20 sm:w-24 px-3 py-2 border-r border-stone-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-stone-700 tabular-nums">
                    {slot}
                  </span>
                </div>

                {/* Conteúdo do Horário */}
                <div className="flex-1 p-2 flex items-center">
                  {matchedApp ? (
                    <div className={`w-full border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                      matchedApp.status === 'no_show'
                        ? 'bg-rose-50/70 border-rose-200'
                        : matchedApp.status === 'completed'
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-amber-50/70 border-amber-200/80'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          matchedApp.status === 'no_show' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {matchedApp.status === 'no_show' ? '⚠️' : '💅'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-stone-900">
                              {matchedApp.customerName}
                            </span>
                            <span className="text-stone-400 text-xs">·</span>
                            <span className="text-xs font-medium text-amber-900">
                              {matchedApp.serviceName}
                            </span>
                            <span className="text-[10px] text-stone-700 bg-white px-1.5 py-0.5 rounded border border-amber-200">
                              {matchedApp.durationMinutes} min
                            </span>

                            {/* Status Badge */}
                            {matchedApp.status === 'no_show' && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 border border-rose-300 px-1.5 py-0.2 rounded">
                                Não Compareceu
                              </span>
                            )}
                            {matchedApp.status === 'completed' && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-1.5 py-0.2 rounded">
                                Concluído
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-600 mt-0.5">
                            Profissional: {matchedApp.professionalName} · {formatCurrencyBRL(matchedApp.price)} · Tel: {matchedApp.customerPhone}
                          </p>
                        </div>
                      </div>

                      {/* Ações do Agendamento */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <button
                          onClick={() => setSelectedAppForWhatsApp(matchedApp)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-100/60 rounded-lg transition"
                          title="Enviar lembrete no WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Reagendar */}
                        <button
                          onClick={() => {
                            setReschedulingApp(matchedApp);
                            setNewRescheduleDate(matchedApp.date);
                            setNewRescheduleTime(matchedApp.time);
                          }}
                          className="p-1.5 text-stone-700 hover:bg-stone-200/70 rounded-lg transition"
                          title="Reagendar horário"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        {/* No-Show (Falta) */}
                        {matchedApp.status !== 'no_show' && matchedApp.status !== 'completed' && (
                          <button
                            onClick={() => recordNoShow(matchedApp.id)}
                            className="p-1.5 text-amber-800 hover:bg-amber-100/70 rounded-lg transition"
                            title="Registrar Falta do Cliente (No-Show)"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}

                        {matchedApp.status !== 'completed' && (
                          <button
                            onClick={() => updateAppointmentStatus(matchedApp.id, 'completed')}
                            className="p-1.5 text-blue-700 hover:bg-blue-100/60 rounded-lg transition"
                            title="Marcar como Concluído"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {matchedApp.status !== 'cancelled' && (
                          <button
                            onClick={() => updateAppointmentStatus(matchedApp.id, 'cancelled')}
                            className="p-1.5 text-rose-600 hover:bg-rose-100/60 rounded-lg transition"
                            title="Cancelar Agendamento"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : matchedBlock ? (
                    <div className="w-full bg-stone-100 border border-stone-300 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-stone-700">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-stone-500" />
                        <span className="font-semibold">Horário Bloqueado:</span>
                        <span>{matchedBlock.reason}</span>
                        <span className="text-stone-400">({matchedBlock.startTime} às {matchedBlock.endTime})</span>
                      </div>
                      <button
                        onClick={() => deleteBlockedTime(matchedBlock.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition"
                        title="Desbloquear horário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isLunchTime ? (
                    <div className="w-full bg-stone-100/70 border border-dashed border-stone-300 rounded-xl px-3 py-2 flex items-center gap-2 text-stone-500 text-xs">
                      <Ban className="w-3.5 h-3.5" />
                      <span>Intervalo Padrão / Pausa Operacional</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSlotClick(slot)}
                      className="w-full h-full text-left text-xs text-transparent group-hover:text-amber-700 font-medium px-3 py-1.5 rounded-lg group-hover:bg-amber-50/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Horário vago — Clique para agendar às {slot}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Reagendamento com Lock Concorrente */}
      {reschedulingApp && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setReschedulingApp(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase mb-1">
              <RefreshCw className="w-4 h-4" />
              <span>Reagendar Atendimento</span>
            </div>
            <h3 className="font-display font-bold text-lg text-stone-900">
              {reschedulingApp.customerName}
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Serviço: {reschedulingApp.serviceName} ({reschedulingApp.durationMinutes} min) com {reschedulingApp.professionalName}.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-900 block mb-1">Nova Data</label>
                <input
                  type="date"
                  value={newRescheduleDate}
                  onChange={(e) => setNewRescheduleDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-900 block mb-1">Novo Horário</label>
                <input
                  type="time"
                  value={newRescheduleTime}
                  onChange={(e) => setNewRescheduleTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReschedulingApp(null)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting || !newRescheduleDate || !newRescheduleTime}
                onClick={async () => {
                  try {
                    setIsSubmitting(true);
                    await rescheduleAppointment(reschedulingApp.id, newRescheduleDate, newRescheduleTime);
                    setReschedulingApp(null);
                  } catch (err: any) {
                    showNotification(err.message, 'error');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-xl transition"
              >
                {isSubmitting ? 'Verificando concorrência...' : 'Confirmar Reagendamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Bloqueio de Horário */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsBlockModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-stone-700 font-bold text-xs uppercase mb-1">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Bloqueio de Agenda</span>
            </div>
            <h3 className="font-display font-bold text-lg text-stone-900">
              Bloquear Horário ou Intervalo
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Impeça novos agendamentos neste período para férias, intervalo ou consultas.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-900 block mb-1">Motivo do Bloqueio</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-hidden"
                  placeholder="Ex: Pausa para almoço, consulta médica, férias"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-stone-900 block mb-1">Início</label>
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-900 block mb-1">Fim</label>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const profId = selectedProfId !== 'all' ? selectedProfId : (professionals[0]?.id || 'prof-1');
                  await createBlockedTime({
                    professionalId: profId,
                    date: currentDateStr,
                    startTime: blockStartTime,
                    endTime: blockEndTime,
                    reason: blockReason,
                  });
                  setIsBlockModalOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition"
              >
                Bloquear Horário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fila de Espera */}
      {isWaitingListModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsWaitingListModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase mb-1">
              <ListOrdered className="w-4 h-4" />
              <span>Fila de Espera Ativa</span>
            </div>
            <h3 className="font-display font-bold text-lg text-stone-900">
              Clientes Aguardando Vaga — {formatDateBR(currentDateStr)}
            </h3>

            {/* Lista Atual */}
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {waitingList.filter((w) => w.desiredDate === currentDateStr).length === 0 ? (
                <p className="text-xs text-stone-500 py-3 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
                  Nenhuma cliente na fila de espera para esta data.
                </p>
              ) : (
                waitingList
                  .filter((w) => w.desiredDate === currentDateStr)
                  .map((w) => (
                    <div key={w.id} className="p-2.5 rounded-xl border border-stone-200 flex items-center justify-between text-xs bg-stone-50">
                      <div>
                        <span className="font-bold text-stone-900 block">{w.customerName}</span>
                        <span className="text-[11px] text-stone-500">{w.serviceName} • Tel: {w.customerPhone}</span>
                      </div>
                      <a
                        href={`https://wa.me/55${w.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${w.customerName}! Abriu um horário para você hoje no ${currentTenant?.tradeName}!`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition"
                      >
                        Chamar
                      </a>
                    </div>
                  ))
              )}
            </div>

            {/* Adicionar Nova Cliente na Fila */}
            <div className="mt-4 border-t border-stone-200 pt-3">
              <span className="text-xs font-bold text-stone-900 block mb-2">Adicionar Cliente à Fila:</span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nome da cliente"
                  value={waitCustomerName}
                  onChange={(e) => setWaitCustomerName(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-stone-200"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp da cliente (ex: 51998765432)"
                  value={waitCustomerPhone}
                  onChange={(e) => setWaitCustomerPhone(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-stone-200"
                />
                <input
                  type="text"
                  placeholder="Serviço desejado"
                  value={waitServiceName}
                  onChange={(e) => setWaitServiceName(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-stone-200"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWaitingListModalOpen(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Fechar
              </button>
              <button
                type="button"
                disabled={!waitCustomerName || !waitCustomerPhone}
                onClick={async () => {
                  await addToWaitingList({
                    customerName: waitCustomerName,
                    customerPhone: waitCustomerPhone,
                    desiredDate: currentDateStr,
                    serviceName: waitServiceName,
                  });
                  setWaitCustomerName('');
                  setWaitCustomerPhone('');
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-xl transition"
              >
                Adicionar à Fila
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais */}
      <NewAppointmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        preselectedDate={currentDateStr}
        preselectedTime={selectedTimeSlot}
        preselectedProfId={selectedProfId !== 'all' ? selectedProfId : undefined}
      />

      <WhatsAppShareModal
        appointment={selectedAppForWhatsApp}
        onClose={() => setSelectedAppForWhatsApp(null)}
      />
    </div>
  );
};
