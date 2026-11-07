import { normalizeName } from "../data/inventorySuggestions";
export interface ImportItem {
  name: string;
  category: string;
  description: string;
  price: number | null;
  durationMinutes: number | null;
  isDuplicate: boolean;
}
export function parseBRL(value: string): number | null {
  let text = value.replace(/R\$/gi, "").trim();
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text))
    text = text.replace(/\./g, "");
  text = text.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const result = Number(text);
  return Number.isFinite(result) && result >= 0 && result <= 1_000_000
    ? result
    : null;
}
export function parseDuration(value: string): number | null {
  const text = value.toLowerCase().trim().replace(",", ".");
  let minutes: number;
  if (/^\d+$/.test(text)) minutes = Number(text);
  else {
    const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:horas?|h)\s*(\d{1,2})?/);
    const mins = text.match(/(\d+)\s*(?:minutos?|min|m)\b/);
    if (!hours && !mins) return null;
    minutes =
      (hours ? Number(hours[1]) * 60 : 0) +
      (mins ? Number(mins[1]) : hours?.[2] ? Number(hours[2]) : 0);
  }
  return Number.isInteger(minutes) && minutes >= 5 && minutes <= 720
    ? minutes
    : null;
}
function cells(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else quoted = !quoted;
    } else if (line[i] === ";" && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += line[i];
  }
  values.push(current.trim());
  return values;
}
export function isImportItemValid(
  item: Pick<ImportItem, "name" | "price" | "durationMinutes">,
) {
  if (!item || typeof item !== "object") return false;
  return (
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    item.name.trim().length <= 200 &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    item.price <= 1_000_000 &&
    typeof item.durationMinutes === "number" &&
    Number.isInteger(item.durationMinutes) &&
    item.durationMinutes >= 5 &&
    item.durationMinutes <= 720
  );
}
export function parseCatalogueText(
  raw: string,
  existing: Pick<ImportItem, "name">[] = [],
): ImportItem[] {
  if (raw.length > 50_000)
    throw Error("Use no máximo 50 mil caracteres por importação.");
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 101)
    throw Error("Importe no máximo 100 serviços por vez.");
  const seen = new Set(existing.map((i) => normalizeName(i.name)));
  const result: ImportItem[] = [];
  let header: string[] | null = null;
  for (const line of lines) {
    const columns = cells(line);
    const names = columns.map(normalizeName);
    if (names.includes("nome") && names.some((n) => /preco|valor/.test(n))) {
      header = names;
      continue;
    }
    let name: string,
      category = "Serviços",
      description = "",
      price: number | null = null,
      durationMinutes: number | null = null;
    if (columns.length >= 3) {
      const col = (aliases: string[], fallback: number) => {
        const index = header
          ? header.findIndex((n) =>
              aliases.some((a) => n === a || n.startsWith(a + " ")),
            )
          : fallback;
        return index >= 0 ? columns[index] || "" : "";
      };
      name = col(["nome", "servico"], 0);
      category = col(["categoria"], 1) || category;
      price = parseBRL(col(["preco", "valor"], 2));
      durationMinutes = parseDuration(col(["duracao", "minutos"], 3));
      description = col(["descricao"], 4);
    } else {
      if (
        /^\s*[*#]*\s*(tabela|nome|serviços e preços|catalogo|catálogo)\b/i.test(
          line,
        )
      )
        continue;
      const priceMatch = line.match(/R\$\s*\d[\d.,]*/i);
      const timeMatch = line.match(
        /\d+(?:[.,]\d+)?\s*(?:horas?|h)(?:\s*\d{1,2}(?:\s*(?:minutos?|min))?)?|\d+\s*(?:minutos?|min)\b/i,
      );
      price = priceMatch ? parseBRL(priceMatch[0]) : null;
      durationMinutes = timeMatch ? parseDuration(timeMatch[0]) : null;
      name = line
        .replace(priceMatch?.[0] || "\u0000", "")
        .replace(timeMatch?.[0] || "\u0000", "")
        .replace(/[*#()]/g, "")
        .replace(/^[-•\s]+|[-:–\s]+$/g, "")
        .trim();
    }
    if (!name) continue;
    const normalized = normalizeName(name);
    const isDuplicate = seen.has(normalized);
    seen.add(normalized);
    result.push({
      name,
      category,
      description,
      price,
      durationMinutes,
      isDuplicate,
    });
  }
  if (result.length > 100)
    throw Error("Importe no máximo 100 serviços por vez.");
  return result;
}
