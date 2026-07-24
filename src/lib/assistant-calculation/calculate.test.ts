import { describe, expect, it } from "vitest";
import { JULY_2026_ASSISTANT_PARAMETERS as A } from "@/data/parameters/assistants-2026-07";
import { calculateAssistantSalary, calculateAssistantZoneBonus } from "./calculate";
import type { AssistantCalculationInput } from "./types";

const baseInput: AssistantCalculationInput = {
  weeklyHours: 44,
  countedRemuneration: A.technicalMinimum44h,
  biennia: 0,
  priorityAllowance: 0,
  difficultConditionsPercentage: 0,
  zonePercentage: 0,
  zonePreviousMonthGross: A.technicalMinimum44h,
  territorialAllowance: 0,
  academicExcellenceBonus: 0,
  law19464Increase: 0,
  afp: "habitat",
  healthSystem: "fonasa",
  isaprePlanUf: 0,
  apv: 0,
  apvTaxDeductible: false,
  contractType: "indefinite",
  afcContributionEnded: false,
  manualItems: [],
};

describe("calculateAssistantSalary", () => {
  it("uses the technical-category minimum and prorates it by hours", () => {
    expect(calculateAssistantSalary(baseInput).minimumTarget).toBe(668_412);
    expect(calculateAssistantSalary({ ...baseInput, weeklyHours: 22, countedRemuneration: 0 }).minimumTarget).toBe(334_206);
  });

  it("adds a complement when computable remuneration is below the legal floor", () => {
    const result = calculateAssistantSalary({ ...baseInput, countedRemuneration: 500_000 });
    expect(result.earnings.find((line) => line.id === "minimum-supplement")?.amount).toBe(168_412);
  });

  it("calculates two percent of the proportional minimum per biennium", () => {
    const result = calculateAssistantSalary({ ...baseInput, weeklyHours: 22, countedRemuneration: 334_206, biennia: 3 });
    expect(result.earnings.find((line) => line.id === "assistant-experience")?.amount).toBe(Math.round(334_206 * 0.06));
  });

  it("caps experience at fifteen biennia", () => {
    const atFifteen = calculateAssistantSalary({ ...baseInput, biennia: 15 });
    const overLimit = calculateAssistantSalary({ ...baseInput, biennia: 40 });
    expect(overLimit.earnings.find((line) => line.id === "assistant-experience")?.amount)
      .toBe(atFifteen.earnings.find((line) => line.id === "assistant-experience")?.amount);
  });

  it("adds the maximum 2026 low-income bonus at the minimum without experience", () => {
    const result = calculateAssistantSalary(baseInput);
    expect(result.lowIncomeBonus).toBe(62_903);
  });

  it("reduces and then removes the 2026 low-income bonus as gross pay increases", () => {
    const reduced = calculateAssistantSalary({ ...baseInput, countedRemuneration: 700_000 });
    const none = calculateAssistantSalary({ ...baseInput, countedRemuneration: 800_000 });
    expect(reduced.lowIncomeBonus).toBeGreaterThan(0);
    expect(reduced.lowIncomeBonus).toBeLessThan(62_903);
    expect(none.lowIncomeBonus).toBe(0);
  });

  it("does not treat a declared non-remunerative benefit as gross pay for the 2026 bonus", () => {
    const result = calculateAssistantSalary({
      ...baseInput,
      manualItems: [{ id: "family", name: "Asignación familiar", amount: 100_000, kind: "nonImposable" }],
    });
    expect(result.lowIncomeBonus).toBe(62_903);
  });

  it("calculates the separate non-imposable and non-taxable zone bonus", () => {
    expect(A.zoneBonus.grade24Base).toBe(203_297);
    const result = calculateAssistantSalary({ ...baseInput, zonePercentage: 10 });
    const zone = result.earnings.find((line) => line.id === "assistant-zone-21819");
    expect(zone?.amount).toBe(Math.round(A.zoneBonus.grade24Base * 0.617 * 0.1));
    expect(zone).toMatchObject({ imposable: false, taxable: false, countsForMinimum: false });
    expect(result.lowIncomeBonus).toBe(62_903);
  });

  it("includes ordinary remunerative benefits in the gross used by the 2026 low-income bonus", () => {
    const result = calculateAssistantSalary({
      ...baseInput,
      priorityAllowance: 100_000,
      territorialAllowance: 100_000,
      academicExcellenceBonus: 100_000,
      law19464Increase: 100_000,
    });
    expect(result.lowIncomeBonus).toBe(0);
  });

  it("applies income reduction, part-time proportionality and the first zone implementation stage", () => {
    const full = calculateAssistantZoneBonus({ weeklyHours: 44, zonePercentage: 20, zonePreviousMonthGross: A.zoneBonus.lowerGrossThreshold });
    const reducedPartTime = calculateAssistantZoneBonus({ weeklyHours: 22, zonePercentage: 20, zonePreviousMonthGross: 1_521_000 });
    expect(full).toBe(Math.round(A.zoneBonus.grade24Base * 0.617 * 0.2 * 0.5));
    expect(reducedPartTime).toBe(Math.round(A.zoneBonus.grade24Base * 0.617 * 0.2 * 0.5 * 0.5 * 0.5));
  });

  it("uses the June 2026 adjusted zone thresholds at their exact boundaries", () => {
    expect(A.zoneBonus.lowerGrossThreshold).toBe(1_419_600);
    expect(A.zoneBonus.upperGrossThreshold).toBe(1_622_400);

    const atLower = calculateAssistantZoneBonus({ weeklyHours: 44, zonePercentage: 600, zonePreviousMonthGross: 1_419_600 });
    const justAboveLower = calculateAssistantZoneBonus({ weeklyHours: 44, zonePercentage: 600, zonePreviousMonthGross: 1_419_601 });
    const justBelowUpper = calculateAssistantZoneBonus({ weeklyHours: 44, zonePercentage: 600, zonePreviousMonthGross: 1_622_399 });
    const atUpper = calculateAssistantZoneBonus({ weeklyHours: 44, zonePercentage: 600, zonePreviousMonthGross: 1_622_400 });

    expect(atLower).toBe(Math.round(A.zoneBonus.grade24Base * 0.617 * 6 * 0.5));
    expect(justAboveLower).toBeLessThan(atLower);
    expect(justBelowUpper).toBeGreaterThan(0);
    expect(atUpper).toBe(0);
    expect(calculateAssistantSalary({ ...baseInput, zonePercentage: 20, zonePreviousMonthGross: 1_622_400 }).warnings).not.toContain("La bonificación de zona aplica el 50% de gradualidad vigente durante los primeros doce meses por superar 15% de zona.");
  });

  it("applies the personal AFC contribution only to indefinite contracts", () => {
    const indefinite = calculateAssistantSalary(baseInput);
    const fixed = calculateAssistantSalary({ ...baseInput, contractType: "fixed" });
    expect(indefinite.discounts.find((line) => line.id === "afc")?.amount).toBeGreaterThan(0);
    expect(fixed.discounts.some((line) => line.id === "afc")).toBe(false);
  });
});
