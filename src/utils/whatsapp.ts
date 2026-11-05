import { Appointment, Tenant } from '../types';
import { formatCurrencyBRL, formatDateBR } from './validators';

export function getCleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = getCleanPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function buildConfirmationMessage(appointment: Appointment, tenant: Tenant): string {
  const locationText = appointment.isDomicile 
    ? `Atendimento em Domicílio: ${appointment.address || 'Endereço a combinar'}`
    : `Endereço: ${tenant.address || `${tenant.city} - ${tenant.state}`}`;

  return `✨ *Confirmação de Agendamento — ${tenant.tradeName}*\n\n` +
    `Olá, *${appointment.customerName}*! Tudo bem?\n` +
    `Seu agendamento foi registrado com sucesso:\n\n` +
    `💅 *Serviço:* ${appointment.serviceName}\n` +
    `👩‍🎨 *Profissional:* ${appointment.professionalName}\n` +
    `📅 *Data:* ${formatDateBR(appointment.date)}\n` +
    `⏰ *Horário:* ${appointment.time}\n` +
    `⏳ *Duração estimada:* ${appointment.durationMinutes} minutos\n` +
    `💰 *Valor:* ${formatCurrencyBRL(appointment.price)}\n` +
    `📍 ${locationText}\n\n` +
    `Caso necessite reagendar ou cancelar, por favor nos avise com pelo menos 2 horas de antecedência.\n` +
    `Estamos ansiosas para te atender! ✨`;
}

export function buildReminder24hMessage(appointment: Appointment, tenant: Tenant): string {
  return `⏰ *Lembrete de Horário — ${tenant.tradeName}*\n\n` +
    `Olá, *${appointment.customerName}*! Passando para lembrar do seu atendimento amanhã:\n\n` +
    `💅 *Serviço:* ${appointment.serviceName}\n` +
    `📅 *Amanhã:* ${formatDateBR(appointment.date)} às *${appointment.time}*\n` +
    `👩‍🎨 *Com:* ${appointment.professionalName}\n\n` +
    `Por favor, responda com *CONFIRMAR* para mantermos seu horário reservado com carinho! ✨`;
}

export function buildReminder2hMessage(appointment: Appointment, tenant: Tenant): string {
  return `🔔 *Seu horário é hoje! — ${tenant.tradeName}*\n\n` +
    `Oi *${appointment.customerName}*, faltam apenas 2 horas para o seu atendimento às *${appointment.time}*!\n` +
    `Já estamos preparando tudo para receber você. Até logo! 💅✨`;
}

export function buildCancellationMessage(appointment: Appointment, tenant: Tenant): string {
  return `ℹ️ *Aviso de Cancelamento — ${tenant.tradeName}*\n\n` +
    `Olá, *${appointment.customerName}*. Confirmamos o cancelamento do seu agendamento de *${appointment.serviceName}* do dia ${formatDateBR(appointment.date)} às ${appointment.time}.\n\n` +
    `Quando quiser marcar uma nova data, basta acessar nosso link: ${window.location.origin}/${tenant.slug}`;
}

export function buildFeedbackMessage(appointment: Appointment, tenant: Tenant): string {
  return `💖 *Como foi sua experiência? — ${tenant.tradeName}*\n\n` +
    `Oi, *${appointment.customerName}*! Adoramos ter você conosco hoje!\n` +
    `Suas unhas ficaram impecáveis? Conta pra gente o que achou do atendimento da *${appointment.professionalName}*!\n` +
    `Sua opinião nos ajuda a evoluir sempre. Obrigada pelo carinho! 🌟`;
}

export function buildReturnMaintenanceMessage(customerName: string, serviceName: string, tenant: Tenant): string {
  return `✨ *Hora de renovar o cuidado! — ${tenant.tradeName}*\n\n` +
    `Oi, *${customerName}*! Tudo bem?\n` +
    `Já se passaram quase 3 semanas desde o seu último *${serviceName}*.\n` +
    `Para manter a saúde e beleza das suas unhas perfeitas, que tal garantir sua manutenção para os próximos dias?\n\n` +
    `Escolha seu horário pelo nosso link rápido:\n` +
    `👉 ${window.location.origin}/${tenant.slug}`;
}
