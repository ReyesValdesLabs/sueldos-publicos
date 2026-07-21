import { describe, expect, it } from "vitest";
import { JULY_2026_ASSISTANT_PARAMETERS as A } from "@/data/parameters/assistants-2026-07";
import { calculateAssistantSalary } from "./calculate";
import type { AssistantCalculationInput } from "./types";

const baseInput: AssistantCalculationInput = {
  weeklyHours: 44,
  countedRemuneration: A.technicalMinimum44h,
  biennia: 0,
  priorityAllowance: 0,
  difficultConditionsPercentage: 0,
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

  it("applies the personal AFC contribution only to indefinite contracts", () => {
    const indefinite = calculateAssistantSalary(baseInput);
    const fixed = calculateAssistantSalary({ ...baseInput, contractType: "fixed" });
    expect(indefinite.discounts.find((line) => line.id === "afc")?.amount).toBeGreaterThan(0);
    expect(fixed.discounts.some((line) => line.id === "afc")).toBe(false);
  });
});
