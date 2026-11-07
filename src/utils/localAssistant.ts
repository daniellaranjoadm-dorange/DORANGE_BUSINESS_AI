import type { businessInsights } from "./businessInsights";
export function localAssistantReply(
  message: string,
  summary: ReturnType<typeof businessInsights>,
  businessName: string,
) {
  const text = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/preco|margem|rentab|lucro|custo/.test(text))
    return {
      content:
        "Para definir preços, considere materiais, tempo de trabalho, estrutura, taxas e comissão. Use o simulador com seus valores reais. Ele não altera seu catálogo e não faz pesquisa de mercado.",
      action: "pricing",
    };
  if (/estoque|insumo|material|reposicao/.test(text))
    return {
      content: summary.lowStock.length
        ? `Há ${summary.lowStock.length} itens no mínimo ou abaixo dele: ${summary.lowStock
            .slice(0, 8)
            .map((i) => `${i.name} (${i.quantity} ${i.unit})`)
            .join(
              "; ",
            )}. Confira a contagem física antes de comprar. No estoque também há sugestões do seu nicho.`
        : "Nenhum item está no limite de reposição cadastrado. Abra o estoque para conferir quantidades e conhecer sugestões do seu nicho.",
      action: "inventory",
    };
  if (/receber|caixa|finance|pagamento/.test(text))
    return {
      content: `Há ${summary.receivables.length} lançamento(s) de receita pendente(s), vencidos ou para hoje. Confira os recebimentos e baixe apenas pagamentos efetivamente confirmados. O saldo de caixa não equivale ao lucro contábil.`,
      action: "financial",
    };
  if (/agend|horario|marcar|confirm/.test(text))
    return {
      content: `Você tem ${summary.confirmations.length} confirmação(ões) pendente(s) para hoje e amanhã e ${summary.unresolved.length} atendimento(s) anterior(es) sem desfecho. Para agendar, escolha cliente, serviço, profissional, data e horário na agenda; a disponibilidade será validada ao salvar. Não reservei nem alterei nenhum horário.`,
      action: "calendar",
    };
  if (/post|legenda|instagram|divulga|marketing/.test(text))
    return {
      content: `Sugestão de texto para você revisar:\n\nNo ${businessName}, cada atendimento começa com atenção ao que você precisa. Conheça nossos serviços e consulte os próximos horários no nosso portal de agendamento. Fale com a gente para tirar suas dúvidas.\n\nCompartilhe apenas com quem autorizou receber sua comunicação.`,
      action: "marketing",
    };
  return {
    content:
      "Posso ajudar com as prioridades da agenda, reposição de insumos, recebimentos e cálculo de preços. Estas orientações usam regras locais e seus registros, sem consumir IA externa. Para uma análise aberta, você pode ativar a IA externa antes de enviar a próxima mensagem.",
    action: "dashboard",
  };
}
