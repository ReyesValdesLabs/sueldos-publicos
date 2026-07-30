import { JULY_2026_DAEM_ASSISTANT_PARAMETERS as D } from "@/data/parameters/daem-assistants-2026-07";
import { JULY_2026_PARAMETERS as P, type PeriodParameters } from "@/data/parameters/2026-07";
import {
  isManualEarning,
  MANUAL_EARNING_TREATMENT,
  type ResultLine,
} from "@/lib/calculation/types";
import type {
  AdministrativeCalculationInput,
  AdministrativeCalculationResult,
  AdministrativeRegime,
} from "./types";

const money = (value: number) => Math.round(Math.max(0, value));
const sum = (lines: ResultLine[]) => lines.reduce((total, line) => total + line.amount, 0);
const MANAGEMENT_QUARTER_MONTHS = 3;
const DAEM_CENTRAL_MAXIMUM_WEEKLY_HOURS = 42;
const LABOR_CODE_PART_TIME_MAXIMUM_WEEKLY_HOURS = 30;

function calculateIncomeTax(taxableBase: number, payrollParameters: PeriodParameters) {
  const bracket = payrollParameters.taxBrackets.find(
    (candidate) => taxableBase <= candidate.upTo,
  ) ?? payrollParameters.taxBrackets.at(-1)!;
  return money(Math.max(0, taxableBase * bracket.factor - bracket.rebate));
}

export function getAdministrativeMaximumWeeklyHours(regime: AdministrativeRegime) {
  return regime === "daemCentral"
    ? DAEM_CENTRAL_MAXIMUM_WEEKLY_HOURS
    : D.minimumIncome.maximumWeeklyHours;
}

export function calculateAdministrativeMinimumIncome(
  weeklyHours: number,
  regime: AdministrativeRegime = "educationEstablishment",
) {
  const maximumWeeklyHours = getAdministrativeMaximumWeeklyHours(regime);
  const hours = Math.min(maximumWeeklyHours, money(weeklyHours));
  if (hours < 1) return 0;
  return regime === "daemCentral" && hours <= LABOR_CODE_PART_TIME_MAXIMUM_WEEKLY_HOURS
    ? money(D.minimumIncome.monthly * hours / maximumWeeklyHours)
    : D.minimumIncome.monthly;
}

export function calculateAdministrativeSalary(
  input: AdministrativeCalculationInput,
  payrollParameters: PeriodParameters = P,
): AdministrativeCalculationResult {
  const declaredHours = money(input.weeklyHours);
  const maximumWeeklyHours = getAdministrativeMaximumWeeklyHours(input.regime);
  const hours = Math.min(maximumWeeklyHours, declaredHours);
  const hoursRatio = hours / maximumWeeklyHours;
  const isMunicipalStatute = input.regime === "municipalStatute";
  const isEducationEstablishment = input.regime === "educationEstablishment";
  const isDaemCentral = input.regime === "daemCentral";
  const earnings: ResultLine[] = [];

  if (input.baseSalary > 0) {
    earnings.push({
      id: "base-salary",
      label: isMunicipalStatute ? "Sueldo base del grado informado" : "Sueldo base contractual informado",
      amount: money(input.baseSalary),
      imposable: true,
      taxable: true,
      countsForMinimum: false,
      legalSlug: "administrativos-daem-municipales",
    });
  }

  if (isEducationEstablishment) {
    const establishmentBenefits = [
      { id: "law-19464", label: "Aumento Ley N.º 19.464 informado", amount: input.law19464Increase },
      { id: "local-seniority", label: "Antigüedad local informada", amount: input.localSeniorityAllowance },
      { id: "priority", label: "Alta concentración de alumnos prioritarios informada", amount: input.priorityAllowance },
      { id: "academic-excellence", label: "Bonificación de excelencia académica informada", amount: input.academicExcellenceBonus },
    ] as const;
    for (const benefit of establishmentBenefits) {
      if (benefit.amount > 0) {
        earnings.push({
          ...benefit,
          amount: money(benefit.amount),
          imposable: true,
          taxable: true,
          countsForMinimum: false,
          legalSlug: "administrativos-daem-municipales",
        });
      }
    }

    if (input.difficultConditionsPercentage > 0) {
      earnings.push({
        id: "difficult-conditions",
        label: "Desempeño en condiciones difíciles 2026",
        amount: money(
          payrollParameters.hourlyRate.basic
          * 0.35
          * (input.difficultConditionsPercentage / 100)
          * hours,
        ),
        imposable: true,
        taxable: true,
        countsForMinimum: false,
        legalSlug: "asistentes-daem-bonos-2026",
      });
    }
  }

  let municipalBienniaAllowance = 0;
  if (isMunicipalStatute) {
    if (input.municipalAllowance > 0) {
      earnings.push({
        id: "municipal-allowance",
        label: "Asignación municipal informada",
        amount: money(input.municipalAllowance),
        imposable: false,
        taxable: true,
        countsForMinimum: false,
        legalSlug: "administrativos-daem-municipales",
      });
    }

    const recognizedMunicipalBiennia = Math.min(
      15,
      Math.floor(Math.max(0, input.municipalBiennia)),
    );
    municipalBienniaAllowance = money(
      input.baseSalary * 0.02 * recognizedMunicipalBiennia,
    );
    if (municipalBienniaAllowance > 0) {
      earnings.push({
        id: "municipal-biennia",
        label: `Asignación de antigüedad (${recognizedMunicipalBiennia} ${recognizedMunicipalBiennia === 1 ? "bienio" : "bienios"})`,
        amount: municipalBienniaAllowance,
        imposable: true,
        taxable: true,
        countsForMinimum: false,
        legalSlug: "administrativos-daem-municipales",
      });
    }

    if (input.managementAllowanceQuarterlyPayment > 0) {
      earnings.push({
        id: "management-allowance",
        label: "Cuota de asignación de mejoramiento de gestión pagada en julio",
        amount: money(input.managementAllowanceQuarterlyPayment),
        imposable: true,
        taxable: true,
        countsForMinimum: false,
        legalSlug: "administrativos-daem-municipales",
      });
    }
  }

  if ((isEducationEstablishment || isDaemCentral)
    && input.previousMonthGross > 0
    && input.previousMonthGross <= D.article59Bonus.previousMonthGrossLimit) {
    const article59Bonus = money(D.article59Bonus.maximum44h * hoursRatio);
    earnings.push({
      id: "article-59-bonus",
      label: "Bono artículo 59 de la Ley N.º 20.883",
      amount: article59Bonus,
      imposable: true,
      taxable: true,
      countsForMinimum: false,
      legalSlug: "asistentes-daem-bonos-2026",
    });
  }

  for (const item of input.manualItems.filter(isManualEarning).filter((item) => item.amount > 0)) {
    const treatment = MANUAL_EARNING_TREATMENT[item.kind];
    earnings.push({
      id: item.id,
      label: item.name || "Otro haber",
      amount: money(item.amount),
      ...treatment,
      countsForMinimum: false,
    });
  }

  const managementAllowance = earnings.find((line) => line.id === "management-allowance")?.amount ?? 0;
  const managementMonthlyEquivalent = money(
    managementAllowance / MANAGEMENT_QUARTER_MONTHS,
  );
  const pensionCalculationSupported = input.pensionRegime === "afp";
  let managementAfpReliquidation = 0;
  let managementHealthReliquidation = 0;
  let managementHealthLegalReliquidation = 0;
  let managementContributionCompensation = 0;
  if (managementAllowance > 0 && pensionCalculationSupported) {
    const regularImposableBeforeBonus = sum(
      earnings.filter((line) => line.imposable && line.id !== "management-allowance"),
    );
    const planAmount = input.healthSystem === "isapre"
      ? money(input.isaprePlanUf * payrollParameters.uf)
      : 0;
    const cappedWithoutManagement = Math.min(
      regularImposableBeforeBonus,
      payrollParameters.pensionCapUf * payrollParameters.uf,
    );
    const cappedWithMonthlyManagement = Math.min(
      regularImposableBeforeBonus + managementMonthlyEquivalent,
      payrollParameters.pensionCapUf * payrollParameters.uf,
    );
    const monthlyAfpDelta = (cappedWithMonthlyManagement - cappedWithoutManagement)
      * (0.1 + payrollParameters.afpCommission[input.afp]);
    const healthWithoutManagement = Math.max(cappedWithoutManagement * 0.07, planAmount);
    const healthWithManagement = Math.max(
      cappedWithMonthlyManagement * 0.07,
      planAmount,
    );
    managementAfpReliquidation = money(
      monthlyAfpDelta * MANAGEMENT_QUARTER_MONTHS,
    );
    managementHealthReliquidation = money(
      (healthWithManagement - healthWithoutManagement) * MANAGEMENT_QUARTER_MONTHS,
    );
    managementHealthLegalReliquidation = money(
      (cappedWithMonthlyManagement - cappedWithoutManagement)
      * 0.07
      * MANAGEMENT_QUARTER_MONTHS,
    );
    managementContributionCompensation = money(
      managementAfpReliquidation + managementHealthReliquidation,
    );
    if (managementContributionCompensation > 0) {
      earnings.push({
        id: "management-contribution-compensation",
        label: "Bonificación compensatoria de cotizaciones de gestión",
        amount: managementContributionCompensation,
        imposable: false,
        taxable: true,
        countsForMinimum: false,
        legalSlug: "administrativos-daem-municipales",
      });
    }
  }

  const nonRemunerativeManualEarnings = input.manualItems
    .filter(isManualEarning)
    .filter((item) => item.kind === "nonImposableNonTaxable" && item.amount > 0)
    .reduce((total, item) => total + money(item.amount), 0);
  const grossBeforeLowIncomeBonus = sum(earnings) - nonRemunerativeManualEarnings;
  const lowIncomeLower = D.lowIncomeBonus.lowerThreshold44h * hoursRatio;
  const lowIncomeUpper = D.lowIncomeBonus.upperThreshold44h * hoursRatio;
  const lowIncomeMaximum = D.lowIncomeBonus.maximum44h * hoursRatio;
  const legallyEligibleForLowIncomeBonus = !isDaemCentral;
  const lowIncomeBonus = legallyEligibleForLowIncomeBonus
    && input.applyLowIncomeBonus
    && grossBeforeLowIncomeBonus > 0
    && grossBeforeLowIncomeBonus < lowIncomeUpper
    ? money(
      grossBeforeLowIncomeBonus <= lowIncomeLower
        ? lowIncomeMaximum
        : lowIncomeMaximum
          - D.lowIncomeBonus.reductionFactor * (grossBeforeLowIncomeBonus - lowIncomeLower),
    )
    : 0;
  if (lowIncomeBonus > 0) {
    earnings.push({
      id: "low-income-bonus",
      label: "Bono mensual de bajas remuneraciones 2026",
      amount: lowIncomeBonus,
      imposable: true,
      taxable: true,
      countsForMinimum: false,
      legalSlug: "asistentes-daem-bonos-2026",
    });
  }

  const article59Bonus = earnings.find((line) => line.id === "article-59-bonus")?.amount ?? 0;
  const currentImposableEarnings = sum(
    earnings.filter((line) => line.imposable && line.id !== "management-allowance"),
  );
  const currentTaxableEarnings = sum(
    earnings.filter(
      (line) => line.taxable
        && line.id !== "management-allowance"
        && line.id !== "management-contribution-compensation",
    ),
  );
  const imposableBase = money(Math.min(
    currentImposableEarnings,
    payrollParameters.pensionCapUf * payrollParameters.uf,
  ));
  const currentAfp = pensionCalculationSupported
    ? money(imposableBase * (0.1 + payrollParameters.afpCommission[input.afp]))
    : 0;
  const afp = currentAfp + managementAfpReliquidation;
  const healthLegal = money(imposableBase * 0.07);
  const currentHealth = pensionCalculationSupported
    ? input.healthSystem === "isapre"
      ? money(Math.max(healthLegal, input.isaprePlanUf * payrollParameters.uf))
      : healthLegal
    : 0;
  const health = currentHealth + managementHealthReliquidation;
  const afcBase = Math.min(
    currentImposableEarnings,
    payrollParameters.unemploymentCapUf * payrollParameters.uf,
  );
  const afc = !isMunicipalStatute
    && input.contractType === "indefinite"
    && !input.afcContributionEnded
    ? money(afcBase * 0.006)
    : 0;
  const apv = money(input.apv);
  const apvTaxReduction = input.apvTaxDeductible
    ? Math.min(apv, money(payrollParameters.uf * 50))
    : 0;
  const taxableBase = money(Math.max(
    0,
    currentTaxableEarnings - currentAfp - healthLegal - afc - apvTaxReduction,
  ));
  const currentTax = pensionCalculationSupported
    ? calculateIncomeTax(taxableBase, payrollParameters)
    : 0;
  const managementMonthlyCompensation = money(
    managementContributionCompensation / MANAGEMENT_QUARTER_MONTHS,
  );
  const managementMonthlyTaxableBase = managementAllowance > 0
    && pensionCalculationSupported
    ? money(Math.max(
      0,
      currentTaxableEarnings
      + managementMonthlyEquivalent
      + managementMonthlyCompensation
      - currentAfp
      - managementAfpReliquidation / MANAGEMENT_QUARTER_MONTHS
      - healthLegal
      - managementHealthLegalReliquidation / MANAGEMENT_QUARTER_MONTHS
      - afc
      - apvTaxReduction,
    ))
    : taxableBase;
  const managementMonthlyTax = calculateIncomeTax(
    managementMonthlyTaxableBase,
    payrollParameters,
  );
  const managementTaxReliquidation = managementAllowance > 0
    && pensionCalculationSupported
    ? money(
      Math.max(0, managementMonthlyTax - currentTax) * MANAGEMENT_QUARTER_MONTHS,
    )
    : 0;
  const tax = currentTax + managementTaxReliquidation;

  const afpName = input.afp[0].toUpperCase() + input.afp.slice(1);
  const discounts: ResultLine[] = [];
  if (pensionCalculationSupported) {
    discounts.push({
      id: "afp",
      label: managementAfpReliquidation > 0
        ? `AFP ${afpName} (julio y reliquidación de gestión)`
        : `AFP ${afpName}`,
      amount: afp,
      imposable: false,
      taxable: false,
      countsForMinimum: false,
      legalSlug: "cotizaciones-previsionales",
    });
    discounts.push({
      id: "health",
      label: managementHealthReliquidation > 0
        ? `${input.healthSystem === "fonasa" ? "Fonasa (7%)" : "Plan Isapre"} (julio y reliquidación de gestión)`
        : input.healthSystem === "fonasa" ? "Fonasa (7%)" : "Plan Isapre",
      amount: health,
      imposable: false,
      taxable: false,
      countsForMinimum: false,
      legalSlug: "cotizaciones-previsionales",
    });
  }
  if (afc > 0) {
    discounts.push({
      id: "afc",
      label: "Seguro de cesantía (0,6%)",
      amount: afc,
      imposable: false,
      taxable: false,
      countsForMinimum: false,
      legalSlug: "asistentes-seguro-cesantia",
    });
  }
  if (apv > 0) {
    discounts.push({
      id: "apv",
      label: "APV",
      amount: apv,
      imposable: false,
      taxable: false,
      countsForMinimum: false,
      legalSlug: "apv",
    });
  }
  if (tax > 0) {
    discounts.push({
      id: "tax",
      label: managementTaxReliquidation > 0
        ? "Impuesto Único (julio y reliquidación de gestión)"
        : "Impuesto Único de Segunda Categoría",
      amount: tax,
      imposable: false,
      taxable: false,
      countsForMinimum: false,
      legalSlug: "impuesto-unico",
    });
  }
  for (const item of input.manualItems.filter((item) => item.kind === "discount" && item.amount > 0)) {
    discounts.push({
      id: item.id,
      label: item.name || "Otro descuento",
      amount: money(item.amount),
      imposable: false,
      taxable: false,
      countsForMinimum: false,
    });
  }

  const warnings: string[] = [];
  if (isEducationEstablishment) {
    warnings.push("Este recorrido exige desempeñarse como asistente administrativo/a dentro de un establecimiento educacional municipal; no corresponde al nivel central del DAEM.");
  }
  if (isDaemCentral) {
    warnings.push("No se aplicaron automáticamente el aumento de la Ley N.º 19.464 ni beneficios propios del establecimiento, porque el nivel central DAEM/DEM constituye una unidad distinta.");
    warnings.push("El bono mensual de bajas remuneraciones del artículo 13 de la Ley N.º 21.806 no corresponde a este recorrido de nivel central DAEM/DEM.");
  }
  if (isMunicipalStatute) {
    warnings.push(`El grado ${Math.min(20, Math.max(1, money(input.municipalGrade)))} es informativo: confirma sueldo base y asignación municipal en la escala de transparencia vigente de tu municipalidad.`);
    warnings.push("No se descontó Seguro de Cesantía: planta y contrata municipal se rigen por la Ley N.º 18.883, no por un contrato sujeto al Código del Trabajo.");
    if (input.managementAllowanceQuarterlyPayment > 0) {
      warnings.push(`La cuota de gestión de julio se incluyó completa en el bruto y en el líquido. Para estimar su reliquidación previsional y tributaria se distribuyó en tres meses de ${managementMonthlyEquivalent.toLocaleString("es-CL")} y se usó la remuneración actual como aproximación de abril a junio.`);
    }
  }
  if (!pensionCalculationSupported) {
    warnings.push("Cálculo detenido: este recorrido todavía no modela las tasas ni los topes del régimen previsional antiguo administrado por IPS.");
  }
  if (!isMunicipalStatute) {
    const minimumIncome = calculateAdministrativeMinimumIncome(hours, input.regime);
    if (input.baseSalary < minimumIncome) {
      warnings.push(`El sueldo base informado es inferior al ingreso mínimo estimado de $${minimumIncome.toLocaleString("es-CL")} para esta jornada.`);
    }
    if (input.contractType === "fixed") {
      warnings.push("No se descontó el 0,6% personal de AFC porque indicaste un contrato a plazo fijo.");
    }
    if (input.contractType === "indefinite" && input.afcContributionEnded) {
      warnings.push("No se descontó AFC porque indicaste que se cumplió el límite de 11 años de cotizaciones en esta relación laboral.");
    }
  }
  if (declaredHours > maximumWeeklyHours) {
    warnings.push(`La jornada se limitó a ${maximumWeeklyHours} horas para este régimen.`);
  }
  if (legallyEligibleForLowIncomeBonus && !input.applyLowIncomeBonus) {
    warnings.push("No se agregó el bono mensual de bajas remuneraciones porque desactivaste su aplicación para tu vínculo.");
  }

  const totalEarnings = sum(earnings);
  const totalDiscounts = sum(discounts);
  return {
    supported: pensionCalculationSupported,
    earnings,
    discounts,
    totalEarnings,
    totalDiscounts,
    netSalary: totalEarnings - totalDiscounts,
    imposableBase,
    taxableBase,
    managementMonthlyEquivalent,
    managementContributionCompensation,
    article59Bonus,
    lowIncomeBonus,
    municipalBienniaAllowance,
    warnings,
  };
}
