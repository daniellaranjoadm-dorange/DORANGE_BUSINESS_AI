import type { BusinessSegment, BusinessSegmentId } from "../types";
type AddedSegment = Extract<
  BusinessSegmentId,
  "pet_grooming" | "automotive" | "photography" | "tutoring" | "tailoring"
>;
function segment(
  id: AddedSegment,
  name: string,
  tagline: string,
  professional: string,
  services: [string, number, string[]][],
): BusinessSegment {
  return {
    id,
    code: id.toUpperCase(),
    name,
    tagline,
    description: tagline,
    iconName: "BriefcaseBusiness",
    category: name,
    scheduleModel: "duration_based",
    terminology: {
      appointmentSingular: "Atendimento",
      appointmentPlural: "Atendimentos",
      professionalSingular: professional,
      professionalPlural: "Profissionais",
      serviceSingular: "Serviço",
      servicePlural: "Serviços",
      customerSingular: "Cliente",
      clientActionVerb: "Agendar",
    },
    enabledFeatures: {
      packages: true,
      loyalty: true,
      inventory: true,
      portfolio: true,
      resources: true,
      domicileDisplacement: true,
    },
    defaultSettings: { bufferBetweenMinutes: 15, defaultDurationMinutes: 60 },
    suggestedDurations: { Serviços: 60 },
    suggestedServices: services.map(([service, duration, materials]) => ({
      name: service,
      category: name,
      description: `${service}. Confirme o escopo e o orçamento antes do atendimento.`,
      defaultDurationMinutes: duration,
      suggestedPriceBRL: 0,
      estimatedCostBRL: 0,
      estimatedMarginPercent: 0,
      materialsNeeded: materials,
    })),
  };
}
// Initial templates, not market prices. New niches start with zero prices for operator review.
export const EXPANDED_SEGMENTS: Record<AddedSegment, BusinessSegment> = {
  pet_grooming: segment(
    "pet_grooming",
    "Banho, tosa & cuidados pet",
    "Atendimento por porte, pelagem e necessidades do pet.",
    "Profissional de banho e tosa",
    [
      ["Banho e secagem", 60, ["Shampoo pet", "Toalha"]],
      ["Tosa higiênica", 45, ["Lâmina de tosa", "Higienizador"]],
      ["Escovação e desembolo", 60, ["Escova", "Condicionador pet"]],
    ],
  ),
  automotive: segment(
    "automotive",
    "Estética automotiva",
    "Lavagem, higienização e conservação de veículos.",
    "Especialista automotivo",
    [
      ["Lavagem detalhada", 90, ["Shampoo automotivo", "Microfibra"]],
      ["Higienização interna", 180, ["Limpador de interiores", "Escova"]],
      ["Polimento de conservação", 240, ["Composto polidor", "Boina"]],
    ],
  ),
  photography: segment(
    "photography",
    "Fotografia & produção criativa",
    "Ensaios e produção de conteúdo com escopo definido.",
    "Fotógrafo",
    [
      ["Ensaio em estúdio", 60, ["Fundo fotográfico", "Cartão de memória"]],
      [
        "Fotografia de produtos",
        120,
        ["Fundo fotográfico", "Material de limpeza óptica"],
      ],
      ["Retrato profissional", 45, ["Bateria", "Iluminação"]],
    ],
  ),
  tutoring: segment(
    "tutoring",
    "Aulas particulares & cursos livres",
    "Aulas individuais e encontros educativos por horário.",
    "Professor",
    [
      ["Aula individual", 60, ["Material didático"]],
      ["Aula de reforço", 60, ["Papel", "Caneta"]],
      ["Oficina em grupo", 90, ["Material de apoio"]],
    ],
  ),
  tailoring: segment(
    "tailoring",
    "Costura & ateliês",
    "Provas, ajustes e serviços de costura sob medida.",
    "Profissional de costura",
    [
      ["Prova e avaliação de ajustes", 30, ["Fita métrica", "Giz de alfaiate"]],
      ["Barra de peça", 45, ["Linha", "Agulha"]],
      ["Ajuste de vestuário", 90, ["Linha", "Zíper"]],
    ],
  ),
};
