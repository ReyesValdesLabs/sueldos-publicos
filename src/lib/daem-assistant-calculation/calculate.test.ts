import { describe, expect, it } from "vitest";
import { JULY_2026_PARAMETERS as P } from "@/data/parameters/2026-07";
import { calculateDaemAssistantSalary, calculateDaemMinimumIncome } from "./calculate";
import type { DaemAssistantCalculationInput } from "./types";

const baseInput: DaemAssistantCalculationInput = {
  weeklyHours: 44,
  contractRemuneration: 500_000,
  previousMonthGross: 500_000,
  law19464Increase: 0,
  localSeniorityAllowance: 0,
  priorityAllowance: 0,
  academicExcellenceBonus: 0,
  difficultConditionsPercentage: 0,
  afp: "habitat",
  healthSystem: "fonasa",
  isaprePlanUf: 0,
  apv: 0,
  apvTaxDeductible: false,
  contractType: "indefinite",
  afcContributionEnded: false,
  manualItems: [],
};

describe("calculateDaemAssistantSalary", () => {
  it("uses the full legal minimum above 30 hours and prorates true part-time work", () => {
    expect(calculateDaemMinimumIncome(44)).toBe(553_553);
    expect(calculateDaemMinimumIncome(31)).toBe(553_553);
    expect(calculateDaemMinimumIncome(30)).toBe(377_423);
    expect(calculateDaemMinimumIncome(22)).toBe(276_777);
  });

  it("does not add the SLEP technical minimum or experience biennia", () => {
    const result = calculateDaemAssistantSalary({ ...baseInput, contractRemuneration: 300_000 });
    expect(result.earnings.some((line) => line.id === "minimum-supplement")).toBe(false);
    expect(result.earnings.some((line) => line.id === "assistant-experience")).toBe(false);
  });

  it("adds the article 59 bonus when the previous month gross is within the limit", () => {
    expect(calculateDaemAssistantSalary(baseInput).article59Bonus).toBe(38_320);
    expect(calculateDaemAssistantSalary({ ...baseInput, weeklyHours: 22 }).article59Bonus).toBe(19_160);
  });

  it("removes the article 59 bonus above the previous month gross limit", () => {
    expect(calculateDaemAssistantSalary({ ...baseInput, previousMonthGross: 564_599 }).article59Bonus).toBe(0);
  });

  it("adds the maximum proportional 2026 low-income bonus", () => {
    expect(calculateDaemAssistantSalary(baseInput).lowIncomeBonus).toBe(62_903);
    expect(calculateDaemAssistantSalary({ ...baseInput, weeklyHours: 22, contractRemuneration: 250_000 }).lowIncomeBonus).toBe(31_452);
  });

  it("calculates difficult conditions from the official percentage and hours", () => {
    const result = calculateDaemAssistantSalary({ ...baseInput, difficultConditionsPercentage: 10 });
    expect(result.earnings.find((line) => line.id === "difficult-conditions")?.amount).toBe(30_788);
  });

  it("includes locally declared benefits without treating them as an automatic SLEP rule", () => {
    const result = calculateDaemAssistantSalary({ ...baseInput, law19464Increase: 25_000, localSeniorityAllowance: 40_000 });
    expect(result.earnings.find((line) => line.id === "law-19464")?.amount).toBe(25_000);
    expect(result.earnings.find((line) => line.id === "local-seniority")?.amount).toBe(40_000);
  });

  it("treats a non-imposable but taxable remuneration as gross pay for the 2026 bonus", () => {
    const result = calculateDaemAssistantSalary({
      ...baseInput,
      manualItems: [{ id: "taxable", name: "Haber remuneracional", amount: 250_000, kind: "nonImposableTaxable" }],
    });
    expect(result.lowIncomeBonus).toBe(0);
  });

  it("represents all four combinations of imposability and taxation for manual earnings", () => {
    const result = calculateDaemAssistantSalary({
      ...baseInput,
      contractRemuneration: 3_000_000,
      previousMonthGross: 3_000_000,
      manualItems: [
        { id: "it", name: "Imponible tributable", amount: 100_000, kind: "imposableTaxable" },
        { id: "in", name: "Imponible no tributable", amount: 100_000, kind: "imposableNonTaxable" },
        { id: "nt", name: "No imponible tributable", amount: 100_000, kind: "nonImposableTaxable" },
        { id: "nn", name: "No imponible no tributable", amount: 100_000, kind: "nonImposableNonTaxable" },
      ],
    });

    expect(result.earnings.find((line) => line.id === "it")).toMatchObject({ imposable: true, taxable: true });
    expect(result.earnings.find((line) => line.id === "in")).toMatchObject({ imposable: true, taxable: false });
    expect(result.earnings.find((line) => line.id === "nt")).toMatchObject({ imposable: false, taxable: true });
    expect(result.earnings.find((line) => line.id === "nn")).toMatchObject({ imposable: false, taxable: false });
  });

  it("includes a non-imposable and taxable manual earning in the IUSC base only", () => {
    const regular = calculateDaemAssistantSalary({ ...baseInput, contractRemuneration: 3_000_000, previousMonthGross: 3_000_000 });
    const withTaxableAllowance = calculateDaemAssistantSalary({
      ...baseInput,
      contractRemuneration: 3_000_000,
      previousMonthGross: 3_000_000,
      manualItems: [{ id: "manual-tax", name: "Haber no imponible tributable", amount: 500_000, kind: "nonImposableTaxable" }],
    });
    const bracket = P.taxBrackets.find((candidate) => withTaxableAllowance.taxableBase <= candidate.upTo) ?? P.taxBrackets.at(-1)!;

    expect(withTaxableAllowance.imposableBase).toBe(regular.imposableBase);
    expect(withTaxableAllowance.taxableBase).toBe(regular.taxableBase + 500_000);
    expect(withTaxableAllowance.discounts.find((line) => line.id === "tax")?.amount)
      .toBe(Math.round(Math.max(0, withTaxableAllowance.taxableBase * bracket.factor - bracket.rebate)));
  });

  it("applies the personal AFC contribution only to indefinite contracts", () => {
    expect(calculateDaemAssistantSalary(baseInput).discounts.find((line) => line.id === "afc")?.amount).toBeGreaterThan(0);
    expect(calculateDaemAssistantSalary({ ...baseInput, contractType: "fixed" }).discounts.some((line) => line.id === "afc")).toBe(false);
  });
});
