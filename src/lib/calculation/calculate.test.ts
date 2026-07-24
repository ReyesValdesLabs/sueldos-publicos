import { describe, expect, it } from "vitest";
import { JULY_2026_PARAMETERS as P } from "@/data/parameters/2026-07";
import { calculateTeacherSalary, directorPriorityResponsibilityPercentage, experiencePercentage, suggestedResponsibilityPercentage } from "./calculate";
import type { CalculationInput } from "./types";

const baseInput: CalculationInput = {
  basicHours: 44,
  secondaryHours: 0,
  biennia: 0,
  tranche: "access",
  trancheSuspended: false,
  trancheFixedComponentReduced: false,
  brpEntitlement: "none",
  priorityPercentage: 0,
  rural: false,
  priorityExpired: false,
  zonePercentage: 0,
  responsibilityRole: "none",
  responsibilityPercentage: 0,
  establishmentEnrollment: 0,
  afp: "habitat",
  healthSystem: "fonasa",
  isaprePlanUf: 0,
  apv: 0,
  apvTaxDeductible: true,
  afcEnabled: false,
  contractType: "indefinite",
  afcContributionEnded: false,
  manualItems: [],
};

describe("experiencePercentage", () => {
  it("applies the legal first biennium and caps at 50%", () => {
    expect(experiencePercentage(0)).toBe(0);
    expect(experiencePercentage(1)).toBeCloseTo(0.0338);
    expect(experiencePercentage(15)).toBe(0.5);
    expect(experiencePercentage(40)).toBe(0.5);
  });
});

describe("responsibility percentages", () => {
  it("suggests the statutory percentage for each role and director enrollment tier", () => {
    expect(suggestedResponsibilityPercentage("none", 0)).toBe(0);
    expect(suggestedResponsibilityPercentage("otherDirector", 0)).toBe(20);
    expect(suggestedResponsibilityPercentage("utpHead", 0)).toBe(20);
    expect(suggestedResponsibilityPercentage("otherUtp", 0)).toBe(15);
    expect(suggestedResponsibilityPercentage("director", 399)).toBe(25);
    expect(suggestedResponsibilityPercentage("director", 400)).toBe(37.5);
    expect(suggestedResponsibilityPercentage("director", 800)).toBe(75);
    expect(suggestedResponsibilityPercentage("director", 1200)).toBe(100);
  });

  it("adds the director priority percentage only from 400 students and 60% concentration", () => {
    expect(directorPriorityResponsibilityPercentage(399, 80)).toBe(0);
    expect(directorPriorityResponsibilityPercentage(400, 59)).toBe(0);
    expect(directorPriorityResponsibilityPercentage(400, 60)).toBe(37.5);
    expect(directorPriorityResponsibilityPercentage(800, 60)).toBe(75);
    expect(directorPriorityResponsibilityPercentage(1200, 60)).toBe(100);
  });
});

describe("calculateTeacherSalary", () => {
  it("calculates the legal RBMN independently from an edited paid base", () => {
    const result = calculateTeacherSalary({ ...baseInput, paidBaseSalary: 1_200_000, biennia: 1 });
    expect(result.legalRbmn).toBe(P.hourlyRate.basic * 44);
    expect(result.earnings.find((line) => line.id === "base")?.amount).toBe(1_200_000);
    expect(result.earnings.find((line) => line.id === "experience")?.amount).toBe(Math.round(result.legalRbmn * 0.0338));
    expect(result.warnings).toContain("El sueldo base pagado es superior a la RBMN legal. Las asignaciones que la ley refiere a la RBMN siguen usando la base legal calculada.");
  });

  it("flags a paid base below RBMN without treating the RTM supplement as a replacement", () => {
    const result = calculateTeacherSalary({ ...baseInput, paidBaseSalary: P.hourlyRate.basic * 44 - 100_000 });
    const warning = result.warnings.find((candidate) => candidate.includes("artículo 35"));

    expect(result.earnings.find((line) => line.id === "base")?.amount).toBe(result.legalRbmn - 100_000);
    expect(result.earnings.find((line) => line.id === "minimum-supplement")?.amount).toBeGreaterThan(0);
    expect(warning).toContain("mes completo sin días no remunerados");
    expect(warning).toContain("La planilla complementaria de RTM no reemplaza esa diferencia");
    expect(warning).toContain("mes parcial");
  });

  it("does not flag RBMN when the paid base equals the legal amount", () => {
    const result = calculateTeacherSalary({ ...baseInput, paidBaseSalary: P.hourlyRate.basic * 44 });
    expect(result.warnings.some((warning) => warning.includes("sueldo base pagado"))).toBe(false);
  });

  it("weights the legal RBMN when the contract combines basic and secondary hours", () => {
    const result = calculateTeacherSalary({ ...baseInput, basicHours: 20, secondaryHours: 24 });
    expect(result.legalRbmn).toBe(P.hourlyRate.basic * 20 + P.hourlyRate.secondary * 24);
    expect(result.earnings.find((line) => line.id === "base")?.amount).toBe(result.legalRbmn);
  });

  it("caps BRP proportionality at 30 hours", () => {
    const at30 = calculateTeacherSalary({ ...baseInput, basicHours: 12, secondaryHours: 18, brpEntitlement: "title" });
    const at44 = calculateTeacherSalary({ ...baseInput, basicHours: 20, secondaryHours: 24, brpEntitlement: "title" });
    expect(at30.earnings.find((line) => line.id === "brp-title")?.amount).toBe(P.brp.title);
    expect(at44.earnings.find((line) => line.id === "brp-title")?.amount).toBe(P.brp.title);
  });

  it("pays the title component without creating a mention component", () => {
    const result = calculateTeacherSalary({ ...baseInput, brpEntitlement: "title" });

    expect(result.earnings.find((line) => line.id === "brp-title")?.amount).toBe(P.brp.title);
    expect(result.earnings.some((line) => line.id === "brp-mention")).toBe(false);
    expect(result.earnings.some((line) => line.id === "brp-normal-school-complement")).toBe(false);
  });

  it("pays title and mention together when both are accredited", () => {
    const result = calculateTeacherSalary({ ...baseInput, brpEntitlement: "titleAndMention" });

    expect(result.earnings.find((line) => line.id === "brp-title")?.amount).toBe(P.brp.title);
    expect(result.earnings.find((line) => line.id === "brp-mention")?.amount).toBe(P.brp.mention);
  });

  it("pays both components under the historical short-title exception", () => {
    const result = calculateTeacherSalary({ ...baseInput, brpEntitlement: "historicalShortTitleAndMention" });

    expect(result.earnings.find((line) => line.id === "brp-title")?.amount).toBe(P.brp.title);
    expect(result.earnings.find((line) => line.id === "brp-mention")?.amount).toBe(P.brp.mention);
  });

  it("pays 100% of BRP to Escuela Normal graduates without inventing a mention", () => {
    const result = calculateTeacherSalary({ ...baseInput, brpEntitlement: "normalSchool" });

    expect(result.earnings.find((line) => line.id === "brp-title")?.amount).toBe(P.brp.title);
    expect(result.earnings.find((line) => line.id === "brp-normal-school-complement")?.amount).toBe(P.brp.mention);
    expect(result.earnings.some((line) => line.id === "brp-mention")).toBe(false);
  });

  it("treats zone as imposable but not taxable", () => {
    const result = calculateTeacherSalary({ ...baseInput, zonePercentage: 40 });
    const zone = result.earnings.find((line) => line.id === "zone");
    expect(zone?.amount).toBe(Math.round(result.legalRbmn * 0.4));
    expect(zone?.imposable).toBe(true);
    expect(zone?.taxable).toBe(false);
  });

  it("calculates responsibility on the legal RBMN instead of an edited paid base", () => {
    const result = calculateTeacherSalary({
      ...baseInput,
      paidBaseSalary: 1_500_000,
      tranche: "advanced",
      responsibilityRole: "utpHead",
      responsibilityPercentage: 20,
    });
    const responsibility = result.earnings.find((line) => line.id === "responsibility");
    expect(responsibility?.amount).toBe(Math.round(result.legalRbmn * 0.2));
    expect(responsibility?.amount).not.toBe(300_000);
    expect(responsibility?.countsForMinimum).toBe(true);
  });

  it("adds the director enrollment percentage and its priority supplement as separate earnings", () => {
    const result = calculateTeacherSalary({
      ...baseInput,
      tranche: "advanced",
      responsibilityRole: "director",
      responsibilityPercentage: 75,
      establishmentEnrollment: 800,
      priorityPercentage: 60,
    });
    expect(result.earnings.find((line) => line.id === "responsibility")?.amount).toBe(Math.round(result.legalRbmn * 0.75));
    expect(result.earnings.find((line) => line.id === "responsibility-priority")?.amount).toBe(Math.round(result.legalRbmn * 0.75));
  });

  it("omits responsibility for exceptional non-director appointments below Advanced", () => {
    const result = calculateTeacherSalary({
      ...baseInput,
      tranche: "early",
      responsibilityRole: "otherDirector",
      responsibilityPercentage: 20,
    });
    expect(result.earnings.some((line) => line.id === "responsibility")).toBe(false);
    expect(result.warnings.some((warning) => warning.includes("designados excepcionalmente sin tramo Avanzado"))).toBe(true);
  });

  it("adds the rural priority benefit from 45% concentration", () => {
    const withoutRural = calculateTeacherSalary({ ...baseInput, priorityPercentage: 50 });
    const withRural = calculateTeacherSalary({ ...baseInput, priorityPercentage: 50, rural: true, biennia: 15, tranche: "advanced" });
    expect(withoutRural.earnings.some((line) => line.id === "priority")).toBe(false);
    expect(withRural.earnings.find((line) => line.id === "priority")?.amount).toBeGreaterThan(0);
  });

  it("adds the extra fixed priority amount at 80% only from the Advanced tranche", () => {
    const advancedBelowThreshold = calculateTeacherSalary({ ...baseInput, tranche: "advanced", biennia: 15, priorityPercentage: 79.99 });
    const advancedAtThreshold = calculateTeacherSalary({ ...baseInput, tranche: "advanced", biennia: 15, priorityPercentage: 80 });
    const earlyBelowThreshold = calculateTeacherSalary({ ...baseInput, tranche: "early", biennia: 15, priorityPercentage: 79.99 });
    const earlyAtThreshold = calculateTeacherSalary({ ...baseInput, tranche: "early", biennia: 15, priorityPercentage: 80 });

    expect((advancedAtThreshold.earnings.find((line) => line.id === "priority")?.amount ?? 0)
      - (advancedBelowThreshold.earnings.find((line) => line.id === "priority")?.amount ?? 0)).toBe(P.priority.additionalFixed);
    expect(earlyAtThreshold.earnings.find((line) => line.id === "priority")?.amount)
      .toBe(earlyBelowThreshold.earnings.find((line) => line.id === "priority")?.amount);
  });

  it("reduces only the fixed component after an unfulfilled four-year deepening cycle", () => {
    const expertOne = calculateTeacherSalary({ ...baseInput, tranche: "expert1", biennia: 15, trancheFixedComponentReduced: true });
    const expertTwo = calculateTeacherSalary({ ...baseInput, tranche: "expert2", biennia: 15, trancheFixedComponentReduced: true });
    expect(expertOne.earnings.find((line) => line.id === "tranche-fixed")?.amount).toBe(P.fixedComponent.advanced);
    expect(expertTwo.earnings.find((line) => line.id === "tranche-fixed")?.amount).toBe(P.fixedComponent.expert1);
    expect(expertOne.earnings.find((line) => line.id === "tranche-progression")?.amount).toBe(P.progression.expert1);
  });

  it("removes the fixed component in Advanced and propagates the reduction to priority pay", () => {
    const regular = calculateTeacherSalary({ ...baseInput, tranche: "advanced", biennia: 15, priorityPercentage: 60 });
    const reduced = calculateTeacherSalary({ ...baseInput, tranche: "advanced", biennia: 15, priorityPercentage: 60, trancheFixedComponentReduced: true });
    expect(reduced.earnings.find((line) => line.id === "tranche-fixed")?.amount).toBe(0);
    expect((regular.earnings.find((line) => line.id === "priority")?.amount ?? 0) - (reduced.earnings.find((line) => line.id === "priority")?.amount ?? 0)).toBe(Math.round(P.fixedComponent.advanced * 0.2));
  });

  it("does not invent a tranche assignment when no recognized tranche was selected", () => {
    const result = calculateTeacherSalary({ ...baseInput, tranche: null, biennia: 5 });
    expect(result.earnings.find((line) => line.id === "tranche-experience")?.amount).toBe(0);
    expect(result.earnings.find((line) => line.id === "tranche-progression")?.amount).toBe(0);
    expect(result.warnings).toContain("No se calculó la asignación por tramo porque falta seleccionar el tramo reconocido.");
  });

  it("adds a complementary amount when computable earnings are below RTM", () => {
    const result = calculateTeacherSalary({ ...baseInput, basicHours: 1, paidBaseSalary: 0, trancheSuspended: true });
    expect(result.earnings.find((line) => line.id === "minimum-supplement")?.amount).toBe(result.minimumTarget);
    expect(result.warnings.some((warning) => warning.includes("Remuneración Total Mínima"))).toBe(true);
  });

  it("keeps manual non-imposable earnings outside the pension base", () => {
    const regular = calculateTeacherSalary(baseInput);
    const withAllowance = calculateTeacherSalary({ ...baseInput, manualItems: [{ id: "family", name: "Asignación familiar", amount: 50_000, kind: "nonImposable" }] });
    expect(withAllowance.totalEarnings - regular.totalEarnings).toBe(50_000);
    expect(withAllowance.imposableBase).toBe(regular.imposableBase);
  });

  it("accepts a verified or manual previsional parameter pack", () => {
    const result = calculateTeacherSalary(baseInput, { ...P, uf: 50_000, pensionCapUf: 1 });
    expect(result.imposableBase).toBe(50_000);
    expect(result.discounts.find((line) => line.id === "afp")?.amount).toBe(Math.round(50_000 * 0.1127));
  });

  it("uses the general IUSC brackets for dependent workers", () => {
    const atThirtyFive = calculateTeacherSalary({ ...baseInput, paidBaseSalary: 12_000_000 });
    const atForty = calculateTeacherSalary({ ...baseInput, paidBaseSalary: 25_000_000 });
    expect(atThirtyFive.taxableBase).toBeGreaterThan(10_747_350);
    expect(atThirtyFive.taxableBase).toBeLessThanOrEqual(22_211_190);
    expect(atThirtyFive.discounts.find((line) => line.id === "tax")?.amount).toBe(Math.round(atThirtyFive.taxableBase * 0.35 - 1_670_854.68));
    expect(atForty.taxableBase).toBeGreaterThan(22_211_190);
    expect(atForty.discounts.find((line) => line.id === "tax")?.amount).toBe(Math.round(atForty.taxableBase * 0.4 - 2_781_414.18));
  });

  it("counts declared permanent monthly earnings toward RTM", () => {
    const result = calculateTeacherSalary({ ...baseInput, manualItems: [{ id: "local", name: "Incentivo local permanente", amount: 100_000, kind: "taxable", countsForMinimum: true }] });
    expect(result.earnings.some((line) => line.id === "minimum-supplement")).toBe(false);
  });

  it("stops the personal AFC deduction after eleven years", () => {
    const active = calculateTeacherSalary({ ...baseInput, afcEnabled: true, contractType: "indefinite" });
    const ended = calculateTeacherSalary({ ...baseInput, afcEnabled: true, contractType: "indefinite", afcContributionEnded: true });
    expect(active.discounts.find((line) => line.id === "afc")?.amount).toBeGreaterThan(0);
    expect(ended.discounts.some((line) => line.id === "afc")).toBe(false);
    expect(ended.warnings.some((warning) => warning.includes("11 años"))).toBe(true);
  });

  it("limits an excessive mixed contract proportionally to 44 hours", () => {
    const result = calculateTeacherSalary({ ...baseInput, basicHours: 30, secondaryHours: 30 });
    const expected = Math.round((P.hourlyRate.basic * 30 + P.hourlyRate.secondary * 30) * (44 / 60));
    expect(result.legalRbmn).toBe(expected);
    expect(result.warnings).toContain("La jornada se limitó proporcionalmente a 44 horas para un mismo empleador.");
  });
});
