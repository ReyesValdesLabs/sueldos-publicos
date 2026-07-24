import { JULY_2026_ASSISTANT_PARAMETERS as A, type AssistantPeriodParameters } from "@/data/parameters/assistants-2026-07";
import { JULY_2026_PARAMETERS as P, type PeriodParameters } from "@/data/parameters/2026-07";
import { isManualEarning, MANUAL_EARNING_TREATMENT, type ResultLine } from "@/lib/calculation/types";
import type { AssistantCalculationInput, AssistantCalculationResult } from "./types";

const money = (value: number) => Math.round(Math.max(0, value));
const sum = (lines: ResultLine[]) => lines.reduce((total, line) => total + line.amount, 0);
const LOW_INCOME_GROSS_EXCLUDED_IDS = new Set(["assistant-zone-21819"]);

export function calculateAssistantZoneBonus(
  input: Pick<AssistantCalculationInput, "weeklyHours" | "zonePercentage" | "zonePreviousMonthGross">,
  assistantParameters: AssistantPeriodParameters = A,
) {
  const hoursRatio = Math.min(44, money(input.weeklyHours)) / 44;
  const percentage = Math.max(0, input.zonePercentage);
  const previousGross = money(input.zonePreviousMonthGross);
  if (percentage === 0 || previousGross >= assistantParameters.zoneBonus.upperGrossThreshold) return 0;

  const incomeFactor = previousGross <= assistantParameters.zoneBonus.lowerGrossThreshold
    ? 1
    : (assistantParameters.zoneBonus.upperGrossThreshold - previousGross)
      / (assistantParameters.zoneBonus.upperGrossThreshold - assistantParameters.zoneBonus.lowerGrossThreshold);
  const implementationFactor = percentage <= assistantParameters.zoneBonus.fullImplementationUpToPercentage
    ? 1
    : assistantParameters.zoneBonus.implementationFactorAbovePercentage;
  const maximum = assistantParameters.zoneBonus.grade24Base
    * assistantParameters.zoneBonus.calculationBaseFactor
    * (percentage / 100);
  return money(maximum * hoursRatio * incomeFactor * implementationFactor);
}

export function calculateAssistantSalary(
  input: AssistantCalculationInput,
  assistantParameters: AssistantPeriodParameters = A,
  payrollParameters: PeriodParameters = P,
): AssistantCalculationResult {
  const declaredHours = money(input.weeklyHours);
  const hours = Math.min(44, declaredHours);
  const hoursRatio = hours / 44;
  const biennia = Math.min(15, Math.max(0, money(input.biennia)));
  const minimumTarget = money(assistantParameters.technicalMinimum44h * hoursRatio);

  const earnings: ResultLine[] = [
    {
      id: "counted-remuneration",
      label: "Remuneración mensual computable informada",
      amount: money(input.countedRemuneration),
      imposable: true,
      taxable: true,
      countsForMinimum: true,
      legalSlug: "asistentes-minimo-experiencia",
    },
  ];

  for (const item of input.manualItems.filter(isManualEarning).filter((item) => item.amount > 0 && item.countsForMinimum)) {
    const treatment = MANUAL_EARNING_TREATMENT[item.kind];
    earnings.push({
      id: item.id,
      label: item.name || "Otro haber computable",
      amount: money(item.amount),
      ...treatment,
      countsForMinimum: true,
    });
  }

  const minimumCounted = sum(earnings.filter((line) => line.countsForMinimum));
  if (minimumCounted < minimumTarget) {
    earnings.push({
      id: "minimum-supplement",
      label: "Complemento estimado al mínimo técnico",
      amount: minimumTarget - minimumCounted,
      imposable: true,
      taxable: true,
      countsForMinimum: true,
      legalSlug: "asistentes-minimo-experiencia",
    });
  }

  const experience = money(minimumTarget * 0.02 * biennia);
  if (experience > 0) earnings.push({
    id: "assistant-experience",
    label: "Asignación de experiencia",
    amount: experience,
    imposable: true,
    taxable: true,
    countsForMinimum: false,
    legalSlug: "asistentes-minimo-experiencia",
  });

  if (input.priorityAllowance > 0) earnings.push({
    id: "assistant-priority",
    label: "Alta concentración de alumnos prioritarios",
    amount: money(input.priorityAllowance),
    imposable: true,
    taxable: true,
    countsForMinimum: false,
    legalSlug: "asistentes-asignaciones-establecimiento",
  });

  if (input.difficultConditionsPercentage > 0) earnings.push({
    id: "difficult-conditions",
    label: "Desempeño en condiciones difíciles 2026",
    amount: money(payrollParameters.hourlyRate.basic * 0.35 * (input.difficultConditionsPercentage / 100) * hours),
    imposable: true,
    taxable: true,
    countsForMinimum: false,
    legalSlug: "asistentes-asignaciones-establecimiento",
  });

  const zoneBonus = calculateAssistantZoneBonus(input, assistantParameters);
  if (zoneBonus > 0) earnings.push({
    id: "assistant-zone-21819",
    label: "Bonificación de zona Ley N.º 21.819",
    amount: zoneBonus,
    imposable: false,
    taxable: false,
    countsForMinimum: false,
    legalSlug: "asistentes-asignaciones-establecimiento",
  });

  const declaredBenefits = [
    { id: "territorial", label: "Beneficio territorial informado", amount: input.territorialAllowance, imposable: false, taxable: true },
    { id: "academic-excellence", label: "Bonificación de excelencia académica informada", amount: input.academicExcellenceBonus, imposable: true, taxable: true },
    { id: "law-19464", label: "Aumento Ley N.º 19.464 informado", amount: input.law19464Increase, imposable: true, taxable: true },
  ] as const;
  for (const benefit of declaredBenefits) {
    if (benefit.amount > 0) earnings.push({ ...benefit, amount: money(benefit.amount), countsForMinimum: false, legalSlug: "asistentes-asignaciones-establecimiento" });
  }

  for (const item of input.manualItems.filter(isManualEarning).filter((item) => item.amount > 0 && !item.countsForMinimum)) {
    const treatment = MANUAL_EARNING_TREATMENT[item.kind];
    earnings.push({
      id: item.id,
      label: item.name || "Otro haber",
      amount: money(item.amount),
      ...treatment,
      countsForMinimum: false,
    });
  }

  const nonRemunerativeManualEarnings = input.manualItems
    .filter(isManualEarning)
    .filter((item) => item.kind === "nonImposableNonTaxable" && item.amount > 0)
    .reduce((total, item) => total + money(item.amount), 0);
  const grossBeforeLowIncomeBonus = sum(earnings.filter((line) => !LOW_INCOME_GROSS_EXCLUDED_IDS.has(line.id)))
    - nonRemunerativeManualEarnings;
  const lowIncomeLower = assistantParameters.lowIncomeBonus.lowerThreshold44h * hoursRatio;
  const lowIncomeUpper = assistantParameters.lowIncomeBonus.upperThreshold44h * hoursRatio;
  const lowIncomeMaximum = assistantParameters.lowIncomeBonus.maximum44h * hoursRatio;
  const lowIncomeBonus = grossBeforeLowIncomeBonus < lowIncomeUpper
    ? money(grossBeforeLowIncomeBonus <= lowIncomeLower
      ? lowIncomeMaximum
      : lowIncomeMaximum - assistantParameters.lowIncomeBonus.reductionFactor * (grossBeforeLowIncomeBonus - lowIncomeLower))
    : 0;
  if (lowIncomeBonus > 0) earnings.push({
    id: "low-income-bonus",
    label: "Bono mensual de bajas remuneraciones 2026",
    amount: lowIncomeBonus,
    imposable: true,
    taxable: true,
    countsForMinimum: false,
    legalSlug: "asistentes-bono-2026",
  });

  const imposableEarnings = sum(earnings.filter((line) => line.imposable));
  const taxableEarnings = sum(earnings.filter((line) => line.taxable));
  const imposableBase = money(Math.min(imposableEarnings, payrollParameters.pensionCapUf * payrollParameters.uf));
  const afp = money(imposableBase * (0.1 + payrollParameters.afpCommission[input.afp]));
  const healthLegal = money(imposableBase * 0.07);
  const health = input.healthSystem === "isapre" ? money(Math.max(healthLegal, input.isaprePlanUf * payrollParameters.uf)) : healthLegal;
  const afcBase = Math.min(imposableEarnings, payrollParameters.unemploymentCapUf * payrollParameters.uf);
  const afc = input.contractType === "indefinite" && !input.afcContributionEnded ? money(afcBase * 0.006) : 0;
  const apv = money(input.apv);
  const apvTaxReduction = input.apvTaxDeductible ? Math.min(apv, money(payrollParameters.uf * 50)) : 0;
  const taxableBase = money(Math.max(0, taxableEarnings - afp - healthLegal - afc - apvTaxReduction));
  const bracket = payrollParameters.taxBrackets.find((candidate) => taxableBase <= candidate.upTo) ?? payrollParameters.taxBrackets.at(-1)!;
  const tax = money(Math.max(0, taxableBase * bracket.factor - bracket.rebate));

  const afpName = input.afp[0].toUpperCase() + input.afp.slice(1);
  const discounts: ResultLine[] = [
    { id: "afp", label: `AFP ${afpName}`, amount: afp, imposable: false, taxable: false, countsForMinimum: false, legalSlug: "cotizaciones-previsionales" },
    { id: "health", label: input.healthSystem === "fonasa" ? "Fonasa (7%)" : "Plan Isapre", amount: health, imposable: false, taxable: false, countsForMinimum: false, legalSlug: "cotizaciones-previsionales" },
  ];
  if (afc > 0) discounts.push({ id: "afc", label: "Seguro de cesantía (0,6%)", amount: afc, imposable: false, taxable: false, countsForMinimum: false, legalSlug: "asistentes-seguro-cesantia" });
  if (apv > 0) discounts.push({ id: "apv", label: "APV", amount: apv, imposable: false, taxable: false, countsForMinimum: false, legalSlug: "apv" });
  if (tax > 0) discounts.push({ id: "tax", label: "Impuesto Único de Segunda Categoría", amount: tax, imposable: false, taxable: false, countsForMinimum: false, legalSlug: "impuesto-unico" });
  for (const item of input.manualItems.filter((item) => item.kind === "discount" && item.amount > 0)) {
    discounts.push({ id: item.id, label: item.name || "Otro descuento", amount: money(item.amount), imposable: false, taxable: false, countsForMinimum: false });
  }

  const totalEarnings = sum(earnings);
  const totalDiscounts = sum(discounts);
  const warnings: string[] = [];
  if (declaredHours > 44) warnings.push("La jornada se limitó a 44 horas para un mismo empleador.");
  if (minimumCounted < minimumTarget) warnings.push("Se agregó un complemento estimado para alcanzar el mínimo bruto legal de la categoría técnica.");
  if (input.contractType === "fixed") warnings.push("No se descontó el 0,6% personal de AFC porque indicaste un contrato a plazo fijo.");
  if (input.contractType === "indefinite" && input.afcContributionEnded) warnings.push("No se descontó AFC porque indicaste que se cumplió el límite de 11 años de cotizaciones en esta relación laboral.");
  if (zoneBonus > 0 && input.zonePercentage > assistantParameters.zoneBonus.fullImplementationUpToPercentage) warnings.push("La bonificación de zona aplica el 50% de gradualidad vigente durante los primeros doce meses por superar 15% de zona.");
  if (input.priorityAllowance || input.territorialAllowance || input.academicExcellenceBonus || input.law19464Increase) warnings.push("Las asignaciones ingresadas desde tu liquidación se usan tal como las declaraste; confirma su tratamiento imponible y tributario con el empleador.");

  return {
    minimumTarget,
    earnings,
    discounts,
    totalEarnings,
    totalDiscounts,
    netSalary: totalEarnings - totalDiscounts,
    imposableBase,
    taxableBase,
    lowIncomeBonus,
    zoneBonus,
    warnings,
  };
}
