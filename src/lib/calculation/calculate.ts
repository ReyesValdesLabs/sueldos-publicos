import { JULY_2026_PARAMETERS as P, type PeriodParameters } from "@/data/parameters/2026-07";
import { isManualEarning, MANUAL_EARNING_TREATMENT, type CalculationInput, type CalculationResult, type ResponsibilityRole, type ResultLine, type Tranche } from "./types";

const money = (value: number) => Math.round(Math.max(0, value));
const sum = (lines: ResultLine[]) => lines.reduce((total, line) => total + line.amount, 0);

export function experiencePercentage(biennia: number) {
  if (biennia <= 0) return 0;
  return Math.min(0.5, 0.0338 + 0.0333 * (Math.min(15, biennia) - 1));
}

export function suggestedResponsibilityPercentage(role: ResponsibilityRole, enrollment: number) {
  if (role === "director") {
    if (enrollment >= 1200) return 100;
    if (enrollment >= 800) return 75;
    if (enrollment >= 400) return 37.5;
    return 25;
  }
  if (role === "otherDirector" || role === "utpHead") return 20;
  if (role === "otherUtp") return 15;
  return 0;
}

export function directorPriorityResponsibilityPercentage(enrollment: number, priorityPercentage: number) {
  if (priorityPercentage < 60) return 0;
  if (enrollment >= 1200) return 100;
  if (enrollment >= 800) return 75;
  if (enrollment >= 400) return 37.5;
  return 0;
}

const advancedTranches: Tranche[] = ["advanced", "expert1", "expert2"];

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
  const hasBrpTitle = input.brpEntitlement !== "none";
  const hasBrpMention = input.brpEntitlement === "titleAndMention"
    || input.brpEntitlement === "historicalShortTitleAndMention";
  const hasNormalSchoolComplement = input.brpEntitlement === "normalSchool";

  const earnings: ResultLine[] = [
    { id: "base", label: "Sueldo base", amount: paidBase, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "rbmn" },
    { id: "experience", label: "Asignación de experiencia", amount: experience, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "experiencia" },
    { id: "tranche-experience", label: "Tramo · experiencia", amount: trancheExperience, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "asignacion-tramo" },
    { id: "tranche-progression", label: "Tramo · progresión", amount: progression, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "asignacion-tramo" },
    { id: "tranche-fixed", label: "Tramo · componente fijo", amount: fixed, imposable: true, taxable: true, countsForMinimum: true, legalSlug: "asignacion-tramo" },
  ];

  if (hasBrpTitle) earnings.push({ id: "brp-title", label: "BRP · título", amount: money(parameters.brp.title * brpHours / 30), imposable: true, taxable: true, countsForMinimum: true, legalSlug: "brp" });
  if (hasBrpMention) earnings.push({ id: "brp-mention", label: "BRP · mención", amount: money(parameters.brp.mention * brpHours / 30), imposable: true, taxable: true, countsForMinimum: true, legalSlug: "brp" });
  if (hasNormalSchoolComplement) earnings.push({ id: "brp-normal-school-complement", label: "BRP · complemento Escuela Normal", amount: money(parameters.brp.mention * brpHours / 30), imposable: true, taxable: true, countsForMinimum: true, legalSlug: "brp" });
  if (input.zonePercentage > 0) earnings.push({ id: "zone", label: "Asignación de zona", amount: money(legalRbmn * input.zonePercentage / 100), imposable: true, taxable: false, countsForMinimum: true, legalSlug: "asignacion-zona" });

  const hasResponsibilityRole = input.responsibilityRole !== "none";
  const isExceptionalAppointmentWithoutAdvancedTranche = hasResponsibilityRole
    && input.responsibilityRole !== "director"
    && (input.tranche === null || !advancedTranches.includes(input.tranche));
  if (hasResponsibilityRole && !isExceptionalAppointmentWithoutAdvancedTranche && input.responsibilityPercentage > 0) {
    const responsibilityLabel = input.responsibilityRole === "director" || input.responsibilityRole === "otherDirector"
      ? "Asignación de responsabilidad directiva"
      : "Asignación de responsabilidad técnico-pedagógica";
    earnings.push({ id: "responsibility", label: responsibilityLabel, amount: money(legalRbmn * input.responsibilityPercentage / 100), imposable: true, taxable: true, countsForMinimum: true, legalSlug: "responsabilidad-directiva" });
  }

  const directorPriorityPercentage = input.responsibilityRole === "director"
    ? directorPriorityResponsibilityPercentage(input.establishmentEnrollment, input.priorityPercentage)
    : 0;
  if (directorPriorityPercentage > 0) {
    earnings.push({ id: "responsibility-priority", label: "Responsabilidad directiva · adicional prioritarios", amount: money(legalRbmn * directorPriorityPercentage / 100), imposable: true, taxable: true, countsForMinimum: true, legalSlug: "responsabilidad-directiva" });
  }

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

  for (const item of input.manualItems.filter(isManualEarning).filter((item) => item.amount > 0)) {
    const treatment = MANUAL_EARNING_TREATMENT[item.kind];
    earnings.push({
      id: item.id,
      label: item.name || "Otro haber",
      amount: money(item.amount),
      ...treatment,
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
  if (paidBase < legalRbmn) warnings.push("El sueldo base pagado es inferior a la RBMN legal. Para el mes completo sin días no remunerados que simula esta herramienta, el artículo 35 exige al menos la RBMN calculada. La planilla complementaria de RTM no reemplaza esa diferencia. Si la liquidación corresponde a un mes parcial o incluye días sin derecho a remuneración, esta calculadora no prorratea ese caso.");
  else if (paidBase > legalRbmn) warnings.push("El sueldo base pagado es superior a la RBMN legal. Las asignaciones que la ley refiere a la RBMN siguen usando la base legal calculada.");
  if (input.tranche === null) warnings.push("No se calculó la asignación por tramo porque falta seleccionar el tramo reconocido.");
  else if (input.trancheSuspended) warnings.push("La asignación por tramo se calculó en cero porque indicaste que está suspendida.");
  else if (input.trancheFixedComponentReduced && ["advanced", "expert1", "expert2"].includes(input.tranche)) warnings.push("El componente fijo se redujo al monto del tramo inmediatamente anterior por incumplimiento del ciclo de profundización.");
  if (input.priorityExpired) warnings.push("No se incluyó la asignación por alumnos prioritarios por pérdida temporal del derecho.");
  if (isExceptionalAppointmentWithoutAdvancedTranche) warnings.push("No se incluyó la asignación de responsabilidad: los cargos directivos distintos de director y los técnico-pedagógicos designados excepcionalmente sin tramo Avanzado no tienen derecho a percibirla.");
  if (input.responsibilityRole === "director" && input.establishmentEnrollment > 150 && input.establishmentEnrollment < 400) warnings.push("Para una dirección con 151 a 399 estudiantes, confirma con el sostenedor el porcentaje anual entre 25% y 37,5%; depende también de la asistencia media del año anterior.");
  const suggestedResponsibility = suggestedResponsibilityPercentage(input.responsibilityRole, input.establishmentEnrollment);
  if (hasResponsibilityRole && input.responsibilityPercentage < suggestedResponsibility) warnings.push(`El porcentaje de responsabilidad informado (${input.responsibilityPercentage}%) es inferior al mínimo o valor legal de referencia (${suggestedResponsibility}%) para los datos seleccionados.`);
  if (input.afcEnabled && input.contractType === "indefinite" && input.afcContributionEnded) warnings.push("No se descontó AFC porque indicaste que ya se cumplió el máximo de 11 años de cotizaciones en esta relación laboral.");
  else if (input.afcEnabled) warnings.push("AFC es excepcional en este régimen. Confirma el descuento con tu liquidación o empleador.");
  if (declaredHours > 44) warnings.push("La jornada se limitó proporcionalmente a 44 horas para un mismo empleador.");
  if (minimumCounted < minimumTarget) warnings.push("Se agregó una planilla complementaria estimada para alcanzar la Remuneración Total Mínima.");

  return { legalRbmn, earnings, discounts, totalEarnings, totalDiscounts, netSalary: totalEarnings - totalDiscounts, imposableBase, taxableBase, minimumTarget, warnings };
}
