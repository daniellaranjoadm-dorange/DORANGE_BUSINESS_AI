export interface PricingInputs {
  materials: number;
  durationMinutes: number;
  overheadPerHour: number;
  laborPerHour: number;
  feesPercent: number;
  commissionPercent: number;
  marginPercent: number;
}
export function calculateServicePrice(input: PricingInputs) {
  if (
    Object.values(input).some((v) => !Number.isFinite(v) || v < 0) ||
    input.durationMinutes < 5 ||
    input.durationMinutes > 720
  )
    throw Error(
      "Preencha custos e taxas válidos; duração entre 5 e 720 minutos.",
    );
  const percentage =
    input.feesPercent + input.commissionPercent + input.marginPercent;
  if (percentage >= 100)
    throw Error("Taxas, comissão e margem precisam somar menos de 100%.");
  const directCost =
    input.materials +
    ((input.overheadPerHour + input.laborPerHour) * input.durationMinutes) / 60;
  const price =
    Math.ceil((directCost / (1 - percentage / 100)) * 100 - 1e-8) / 100;
  return {
    price,
    directCost,
    contribution:
      price * (1 - (input.feesPercent + input.commissionPercent) / 100) -
      directCost,
  };
}
