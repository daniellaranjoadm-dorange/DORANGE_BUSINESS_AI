import type { BusinessSegmentId, InventoryItem } from "../types";
export type InventorySuggestion = Pick<
  InventoryItem,
  "name" | "category" | "unit"
>;
const item = (
  name: string,
  category: string,
  unit: InventoryItem["unit"] = "un",
): InventorySuggestion => ({ name, category, unit });
export const INVENTORY_SUGGESTIONS: Record<
  BusinessSegmentId,
  InventorySuggestion[]
> = {
  nails: [
    item("Gel construtor", "Géis", "g"),
    item("Lixas descartáveis", "Descartáveis"),
    item("Esmalte em gel", "Esmaltes", "frasco"),
    item("Removedor", "Preparadores", "ml"),
    item("Fibra de vidro", "Alongamentos", "pacote"),
    item("Luvas descartáveis", "Higiene", "pacote"),
  ],
  barber: [
    item("Lâminas descartáveis", "Descartáveis", "pacote"),
    item("Espuma de barbear", "Barba", "ml"),
    item("Balm pós-barba", "Barba", "ml"),
    item("Pomada modeladora", "Finalização", "g"),
    item("Higienizador de equipamentos", "Higiene", "ml"),
  ],
  beauty: [
    item("Shampoo profissional", "Lavagem", "ml"),
    item("Condicionador profissional", "Lavagem", "ml"),
    item("Coloração", "Coloração", "g"),
    item("Papel alumínio", "Coloração", "pacote"),
    item("Protetor térmico", "Finalização", "ml"),
  ],
  brows_lashes: [
    item("Escovas descartáveis", "Descartáveis", "pacote"),
    item("Fios para extensão", "Cílios", "pacote"),
    item("Adesivo para cílios", "Cílios", "ml"),
    item("Linha de marcação", "Sobrancelhas"),
    item("Pads de proteção", "Descartáveis", "pacote"),
  ],
  esthetics: [
    item("Luvas descartáveis", "Descartáveis", "pacote"),
    item("Gaze", "Descartáveis", "pacote"),
    item("Higienizador facial", "Limpeza", "ml"),
    item("Máscara facial", "Cuidados", "g"),
    item("Lençol descartável", "Descartáveis", "pacote"),
  ],
  massage: [
    item("Óleo de massagem", "Massagem", "ml"),
    item("Creme de massagem", "Massagem", "g"),
    item("Lençol descartável", "Descartáveis", "pacote"),
    item("Higienizador", "Higiene", "ml"),
  ],
  home_services: [
    item("Material de atendimento", "Atendimento"),
    item("Luvas descartáveis", "Proteção", "pacote"),
    item("Pano de limpeza", "Limpeza"),
    item("Produto de limpeza", "Limpeza", "ml"),
  ],
  pet_grooming: [
    item("Shampoo pet", "Banho", "ml"),
    item("Condicionador pet", "Banho", "ml"),
    item("Toalha", "Secagem"),
    item("Lâmina de tosa", "Equipamentos"),
    item("Higienizador", "Higiene", "ml"),
  ],
  automotive: [
    item("Shampoo automotivo", "Lavagem", "ml"),
    item("Pano de microfibra", "Lavagem"),
    item("Limpador de interiores", "Higienização", "ml"),
    item("Composto polidor", "Polimento", "g"),
    item("Boina de polimento", "Polimento"),
  ],
  photography: [
    item("Papel de fundo", "Cenário"),
    item("Material de limpeza óptica", "Limpeza", "ml"),
    item("Bateria", "Equipamentos"),
    item("Cartão de memória", "Equipamentos"),
  ],
  tutoring: [
    item("Material didático", "Didático"),
    item("Papel", "Papelaria", "pacote"),
    item("Caneta", "Papelaria"),
    item("Marcador de quadro", "Didático"),
  ],
  tailoring: [
    item("Linha de costura", "Aviamentos"),
    item("Agulha", "Aviamentos", "pacote"),
    item("Zíper", "Aviamentos"),
    item("Giz de alfaiate", "Marcação"),
    item("Fita métrica", "Medição"),
  ],
};
export const normalizeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
export function missingInventorySuggestions(
  segment: BusinessSegmentId,
  existing: (Pick<InventoryItem, "name"> &
    Partial<Pick<InventoryItem, "category">>)[],
) {
  const names = existing.map((i) =>
    normalizeName(i.name + " " + (i.category || "")),
  );
  return INVENTORY_SUGGESTIONS[segment].filter((i) => {
    const tokens = normalizeName(i.name)
      .split(/[^a-z0-9]+/)
      .filter(
        (t) =>
          !["de", "do", "da", "dos", "das", "para", "em", "com", "e"].includes(
            t,
          ),
      );
    return !names.some((name) =>
      tokens.every((token) => name.split(/[^a-z0-9]+/).includes(token)),
    );
  });
}
