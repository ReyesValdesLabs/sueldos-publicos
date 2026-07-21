import { JULY_2026_DAEM_ASSISTANT_PARAMETERS as D, type DaemAssistantPeriodParameters } from "@/data/parameters/daem-assistants-2026-07";
import { JULY_2026_PARAMETERS as P, type PeriodParameters } from "@/data/parameters/2026-07";
import type { ResultLine } from "@/lib/calculation/types";
import type { DaemAssistantCalculationInput, DaemAssistantCalculationResult } from "./types";

const money = (value: number) => Math.round(Math.max(0, value));
const sum = (lines: ResultLine[]) => lines.reduce((total, line) => total + line.amount, 0);

export function calculateDaemMinimumIncome(
  weeklyHours: number,
  daemParameters: DaemAssistantPeriodParameters = D,
) {
  const hours = Math.min(daemParameters.minimumIncome.maximumWeeklyHours, money(weeklyHours));
  return hours <= daemParameters.minimumIncome.proportionalUpToWeeklyHours
    ? money(daemParameters.minimumIncome.monthly * hours / daemParameters.minimumIncome.maximumWeeklyHours)
    : daemParameters.minimumIncome.monthly;
}

export function calculateDaemAssistantSalary(
  input: DaemAssistantCalculationInput,
  daemParameters: DaemAssistantPeriodParameters = D,
  payrollParameters: PeriodParameters = P,
): DaemAssistantCalculationResult {
  const declaredHours = money(input.weeklyHours);
  const hours = Math.min(44, declaredHours);
  const hoursRatio = hours / 44;
  const earnings: ResultLine[] = [];

  if (input.contractRemuneration > 0) earnings.push({
    id: "contract-remuneration",
    label: "Remuneración contractual informada",
    amount: money(input.contractRemuneration),
    imposable: true,
    taxable: true,
    countsForMinimum: false,
    legalSlug: "asistentes-daem-remuneraciones",
  });

  const declaredBenefits = [
    { id: "law-19464", label: "Bono Ley N.º 19.464 informado", amount: input.law19464Increase },
    { id: "local-seniority", label: "Asignación de antigüedad local informada", amount: input.localSeniorityAllowance },
    { id: "priority", label: "Alta concentración de alumnos prioritarios informada", amount: input.priorityAllowance },
    { id: "academic-excellence", label: "Bonificación de excelencia académica informada", amount: input.academicExcellenceBonus },
  ] as const;
  for (const benefit of declaredBenefits) {
    if (benefit.amount > 0) earnings.push({
      ...benefit,
      amount: money(benefit.amount),
      imposable: true,
      taxable: true,
      countsForMinimum: false,
      legalSlug: "asistentes-daem-remuneraciones",
    });
  }

  if (input.difficultConditionsPercentage > 0) earnings.push({
    id: "difficult-conditions",
    label: "Desempeño en condiciones difíciles 2026",
    amount: money(payrollParameters.hourlyRate.basic * 0.35 * (input.difficultConditionsPercentage / 100) * hours),
    imposable: true,
    taxable: true,
    countsForMinimum: false,
    legalSlug: "asistentes-daem-bonos-2026",
  });

  for (const item of input.manualItems.filter((item) => item.kind !== "discount" && item.amount > 0)) {
    earnings.push({
      id: item.id,
      label: item.name || "Otro haber",
      amount: money(item.amount),
      imposable: item.kind !== "nonImposable",
      taxable: item.kind === "taxable",
      countsForMinimum: false,
    });
  }

  const article59Bonus = input.previousMonthGross > 0
    && input.previousMonthGross <= daemParameters.article59Bonus.previousMonthGrossLimit
    ? money(daemParameters.article59Bonus.maximum44h * hoursRatio)
    : 0;
  if (article59Bonus > 0) earnings.push({
    id: "article-59-bonus",
    label: "Bono artículo 59 de la Ley N.º 20.883",
    amount: article59Bonus,
    imposable: true,
    taxable: true,
    countsForMinimum: false,
    legalSlug: "asistentes-daem-bonos-2026",
  });

  const nonRemunerativeManualEarnings = input.manualItems
    .filter((item) => item.kind === "nonImposable" && item.amount > 0)
    .reduce((total, item) => total + money(item.amount), 0);
  const grossBeforeLowIncomeBonus = sum(earnings) - nonRemunerativeManualEarnings;
  const lowIncomeLower = daemParameters.lowIncomeBonus.lowerThreshold44h * hoursRatio;
  const lowIncomeUpper = daemParameters.lowIncomeBonus.upperThreshold44h * hoursRatio;
  const lowIncomeMaximum = daemParameters.lowIncomeBonus.maximum44h * hoursRatio;
  const lowIncomeBonus = grossBeforeLowIncomeBonus > 0 && grossBeforeLowIncomeBonus < lowIncomeUpper
    ? money(grossBeforeLowIncomeBonus <= lowIncomeLower
      ? lowIncomeMaximum
      : lowIncomeMaximum - daemParameters.lowIncomeBonus.reductionFactor * (grossBeforeLowIncomeBonus - lowIncomeLower))
    : 0;
  if (lowIncomeBonus > 0) earnings.push({
    id: "low-income-bonus",
    label: "Bono mensual de bajas remuneraciones 2026",
    amount: lowIncomeBonus,
    imposable: true,
    taxable: true,
    countsForMinimum: false,
    legalSlug: "asistentes-daem-bonos-2026",
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
  const warnings: string[] = ["Esta estimación DAEM/DEM no aplica el mínimo técnico ni los bienios propios de los SLEP."];
  const minimumIncome = calculateDaemMinimumIncome(hours, daemParameters);
  if (input.contractRemuneration < minimumIncome) warnings.push(`El sueldo base informado es inferior al ingreso mínimo estimado de $${minimumIncome.toLocaleString("es-CL")} para esta jornada.`);
  if (declaredHours > 44) warnings.push("La jornada se limitó a 44 horas para un mismo empleador.");
  if (input.previousMonthGross > daemParameters.article59Bonus.previousMonthGrossLimit) warnings.push("No se agregó el bono del artículo 59 porque el bruto informado del mes anterior supera el límite vigente.");
  if (input.contractType === "fixed") warnings.push("No se descontó el 0,6% personal de AFC porque indicaste un contrato a plazo fijo.");
  if (input.contractType === "indefinite" && input.afcContributionEnded) warnings.push("No se descontó AFC porque indicaste que se cumplió el límite de 11 años de cotizaciones en esta relación laboral.");
  if (input.law19464Increase || input.localSeniorityAllowance || input.priorityAllowance || input.academicExcellenceBonus) warnings.push("Los haberes municipales se usan tal como los informaste; confirma en tu liquidación su monto y tratamiento imponible o tributario.");

  return {
    earnings,
    discounts,
    totalEarnings,
    totalDiscounts,
    netSalary: totalEarnings - totalDiscounts,
    imposableBase,
    taxableBase,
    article59Bonus,
    lowIncomeBonus,
    warnings,
  };
}
