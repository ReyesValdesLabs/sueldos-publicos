import { JULY_2026_PARAMETERS as P, type PeriodParameters } from "@/data/parameters/2026-07";
import type { CalculationInput, CalculationResult, ResultLine } from "./types";

const money = (value: number) => Math.round(Math.max(0, value));
const sum = (lines: ResultLine[]) => lines.reduce((total, line) => total + line.amount, 0);

export function experiencePercentage(biennia: number) {
  if (biennia <= 0) return 0;
  return Math.min(0.5, 0.0338 + 0.0333 * (Math.min(15, biennia) - 1));
}

export function calculateTeacherSalary(input: CalculationInput, parameters: PeriodParameters = P): CalculationResult {
  const declaredBasicHours = money(input.basicHours);
  const declaredSecondaryHours = money(input.secondaryHours);
  const declaredHours = declaredBasicHours + declaredSecondaryHours;
  const hours = Math.min(44, declaredHours);
  const hourScale = declaredHours > 44 ? 44 / declaredHours : 1;
  const biennia = Math.min(15, Math.max(0, money(input.biennia)));
  const legalRbmn = money(
    (parameters.hourlyRate.basic * declaredBasicHours + parameters.hourlyRate.secondary * declaredSecondaryHours) * hourScale,
  );
  const paidBase = input.paidBaseSalary == null ? legalRbmn : money(input.paidBaseSalary);
  const expPct = experiencePercentage(biennia);
  const experience = money(legalRbmn * expPct);
  const hasPayableTranche = input.tranche !== null && !input.trancheSuspended;
  const trancheExperience = hasPayableTranche ? experience : 0;
  const progression = input.tranche !== null && !input.trancheSuspended ? money(parameters.progression[input.tranche] * (hours / 44) * (biennia / 15)) : 0;
  const reducedFixedTranche = input.tranche === "expert2" ? "expert1" : input.tranche === "expert1" ? "advanced" : "early";
  const fixedParameter = input.tranche !== null && input.trancheFixedComponentReduced
    ? parameters.fixedComponent[reducedFixedTranche]
    : input.tranche !== null
      ? parameters.fixedComponent[input.tranche]
      : 0;
  const fixed = hasPayableTranche ? money(fixedParameter * (hours / 44)) : 0;
  const trancheTotal = trancheExperience + progression + fixed;
  const brpHours = Math.min(30, hours);

  const earnings: ResultLine[] = [
    { id: "base", label: "Sueldo base", amount: paidBase, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "rbmn" },
    { id: "experience", label: "Asignación de experiencia", amount: experience, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "experiencia" },
    { id: "tranche-experience", label: "Tramo · experiencia", amount: trancheExperience, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "asignacion-tramo" },
    { id: "tranche-progression", label: "Tramo · progresión", amount: progression, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "asignacion-tramo" },
    { id: "tranche-fixed", label: "Tramo · componente fijo", amount: fixed, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "asignacion-tramo" },
  ];

  if (input.hasBrpTitle) earnings.push({ id: "brp-title", label: "BRP · título", amount: money(parameters.brp.title * brpHours / 30), imposable: true, taxable: true, countsForMinimum: true, legalSlug: "brp" });
  if (input.hasBrpMention) earnings.push({ id: "brp-mention", label: "BRP · mención", amount: money(parameters.brp.mention * brpHours / 30), imposable: true, taxable: true, countsForMinimum: true, legalSlug: "brp" });
  if (input.zonePercentage > 0) earnings.push({ id: "zone", label: "Asignación de zona", amount: money(legalRbmn * input.zonePercentage / 100), imposable: true, taxable: false, countsForMinimum: true, legalSlug: "asignacion-zona" });

  if (!input.priorityExpired) {
    let priorityAmount = 0;
    if (input.rural && input.priorityPercentage >= 45 && input.priorityPercentage < 60) {
      priorityAmount = trancheTotal * 0.1;
    } else if (input.priorityPercentage >= 60) {
      priorityAmount = trancheTotal * 0.2 + parameters.priority.fixed * hours / 44;
      if (input.priorityPercentage >= 80 && input.tranche !== null && ["advanced", "expert1", "expert2"].includes(input.tranche)) priorityAmount += parameters.priority.additionalFixed * hours / 44;
    }
    if (priorityAmount > 0) earnings.push({ id: "priority", label: "Alta concentración de alumnos prioritarios", amount: money(priorityAmount), imposable: true, taxable: true, countsForMinimum: false, legalSlug: "alumnos-prioritarios" });
  }

  for (const item of input.manualItems.filter((item) => item.kind !== "discount" && item.amount > 0)) {
    earnings.push({
      id: item.id,
      label: item.name || "Otro haber",
      amount: money(item.amount),
      imposable: item.kind !== "nonImposable",
      taxable: item.kind === "taxable",
      countsForMinimum: Boolean(item.countsForMinimum),
    });
  }

  const minimumTarget = money(parameters.minimumTotal44h * hours / 44);
  const minimumCounted = sum(earnings.filter((line) => line.countsForMinimum));
  if (minimumCounted < minimumTarget) earnings.push({ id: "minimum-supplement", label: "Planilla complementaria RTM", amount: minimumTarget - minimumCounted, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "remuneracion-total-minima" });

  const imposableEarnings = sum(earnings.filter((line) => line.imposable));
  const taxableEarnings = sum(earnings.filter((line) => line.taxable));
  const imposableBase = money(Math.min(imposableEarnings, parameters.pensionCapUf * parameters.uf));
  const afp = money(imposableBase * (0.1 + parameters.afpCommission[input.afp]));
  const healthLegal = money(imposableBase * 0.07);
  const health = input.healthSystem === "isapre" ? money(Math.max(healthLegal, input.isaprePlanUf * parameters.uf)) : healthLegal;
  const afcBase = Math.min(imposableEarnings, parameters.unemploymentCapUf * parameters.uf);
  const afc = input.afcEnabled && input.contractType === "indefinite" && !input.afcContributionEnded ? money(afcBase * 0.006) : 0;
  const apv = money(input.apv);
  const apvTaxReduction = input.apvTaxDeductible ? Math.min(apv, money(parameters.uf * 50)) : 0;
  const taxableBase = money(Math.max(0, taxableEarnings - afp - healthLegal - afc - apvTaxReduction));
  const bracket = parameters.taxBrackets.find((candidate) => taxableBase <= candidate.upTo) ?? parameters.taxBrackets.at(-1)!;
  const tax = money(Math.max(0, taxableBase * bracket.factor - bracket.rebate));

  const afpName = input.afp[0].toUpperCase() + input.afp.slice(1);
  const discounts: ResultLine[] = [
    { id: "afp", label: `AFP ${afpName}`, amount: afp, imposable: false, taxable: false, countsForMinimum: false, legalSlug: "cotizaciones-previsionales" },
    { id: "health", label: input.healthSystem === "fonasa" ? "Fonasa (7%)" : "Plan Isapre", amount: health, imposable: false, taxable: false, countsForMinimum: false, legalSlug: "cotizaciones-previsionales" },
  ];
  if (afc > 0) discounts.push({ id: "afc", label: "Seguro de cesantía (declarado)", amount: afc, imposable: false, taxable: false, countsForMinimum: false, legalSlug: "cotizaciones-previsionales" });
  if (apv > 0) discounts.push({ id: "apv", label: "APV", amount: apv, imposable: false, taxable: false, countsForMinimum: false, legalSlug: "apv" });
  if (tax > 0) discounts.push({ id: "tax", label: "Impuesto Único de Segunda Categoría", amount: tax, imposable: false, taxable: false, countsForMinimum: false, legalSlug: "impuesto-unico" });
  for (const item of input.manualItems.filter((item) => item.kind === "discount" && item.amount > 0)) discounts.push({ id: item.id, label: item.name || "Otro descuento", amount: money(item.amount), imposable: false, taxable: false, countsForMinimum: false });

  const totalEarnings = sum(earnings);
  const totalDiscounts = sum(discounts);
  const warnings: string[] = [];
  if (paidBase !== legalRbmn) warnings.push("El sueldo base fue editado. Las asignaciones legales siguen usando la RBMN oficial.");
  if (input.tranche === null) warnings.push("No se calculó la asignación por tramo porque falta seleccionar el tramo reconocido.");
  else if (input.trancheSuspended) warnings.push("La asignación por tramo se calculó en cero porque indicaste que está suspendida.");
  else if (input.trancheFixedComponentReduced && ["advanced", "expert1", "expert2"].includes(input.tranche)) warnings.push("El componente fijo se redujo al monto del tramo inmediatamente anterior por incumplimiento del ciclo de profundización.");
  if (input.priorityExpired) warnings.push("No se incluyó la asignación por alumnos prioritarios por pérdida temporal del derecho.");
  if (input.afcEnabled && input.contractType === "indefinite" && input.afcContributionEnded) warnings.push("No se descontó AFC porque indicaste que ya se cumplió el máximo de 11 años de cotizaciones en esta relación laboral.");
  else if (input.afcEnabled) warnings.push("AFC es excepcional en este régimen. Confirma el descuento con tu liquidación o empleador.");
  if (declaredHours > 44) warnings.push("La jornada se limitó proporcionalmente a 44 horas para un mismo empleador.");
  if (minimumCounted < minimumTarget) warnings.push("Se agregó una planilla complementaria estimada para alcanzar la Remuneración Total Mínima.");

  return { legalRbmn, earnings, discounts, totalEarnings, totalDiscounts, netSalary: totalEarnings - totalDiscounts, imposableBase, taxableBase, minimumTarget, warnings };
}
