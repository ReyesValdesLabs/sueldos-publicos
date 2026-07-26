import { describe, expect, it } from "vitest";
import type { AdministrativeCalculationInput } from "./types";
import {
  calculateAdministrativeMinimumIncome,
  calculateAdministrativeSalary,
} from "./calculate";

const baseInput: AdministrativeCalculationInput = {
  regime: "educationEstablishment",
  weeklyHours: 44,
  baseSalary: 553_553,
  previousMonthGross: 553_553,
  law19464Increase: 0,
  localSeniorityAllowance: 0,
  priorityAllowance: 0,
  academicExcellenceBonus: 0,
  difficultConditionsPercentage: 0,
  municipalGrade: 18,
  municipalAllowance: 0,
  municipalBiennia: 0,
  managementAllowanceMonthlyEquivalent: 0,
  applyLowIncomeBonus: true,
  afp: "habitat",
  healthSystem: "fonasa",
  isaprePlanUf: 0,
  apv: 0,
  apvTaxDeductible: false,
  contractType: "indefinite",
  afcContributionEnded: false,
  manualItems: [],
};

describe("calculateAdministrativeSalary", () => {
  it("uses the Code of Labor minimum only for the DAEM routes", () => {
    expect(calculateAdministrativeMinimumIncome(44)).toBe(553_553);
    expect(calculateAdministrativeMinimumIncome(30)).toBe(377_423);

    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 300_000,
    });
    expect(result.warnings.some((warning) => warning.includes("ingreso mínimo"))).toBe(false);
  });

  it("includes establishment benefits only for administrative education assistants", () => {
    const establishment = calculateAdministrativeSalary({
      ...baseInput,
      law19464Increase: 25_000,
      priorityAllowance: 35_000,
      difficultConditionsPercentage: 10,
    });
    const central = calculateAdministrativeSalary({
      ...baseInput,
      regime: "daemCentral",
      law19464Increase: 25_000,
      priorityAllowance: 35_000,
      difficultConditionsPercentage: 10,
    });

    expect(establishment.earnings.some((line) => line.id === "law-19464")).toBe(true);
    expect(establishment.earnings.some((line) => line.id === "priority")).toBe(true);
    expect(establishment.earnings.some((line) => line.id === "difficult-conditions")).toBe(true);
    expect(central.earnings.some((line) => line.id === "law-19464")).toBe(false);
    expect(central.earnings.some((line) => line.id === "priority")).toBe(false);
    expect(central.earnings.some((line) => line.id === "difficult-conditions")).toBe(false);
  });

  it("applies article 59 to both Code of Labor DAEM routes, but not municipal statute", () => {
    expect(calculateAdministrativeSalary(baseInput).article59Bonus).toBe(38_320);
    expect(calculateAdministrativeSalary({ ...baseInput, regime: "daemCentral" }).article59Bonus).toBe(38_320);
    expect(calculateAdministrativeSalary({ ...baseInput, regime: "municipalStatute" }).article59Bonus).toBe(0);
  });

  it("calculates municipal biennia at 2% of base salary with a 15 biennia cap", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 600_000,
      municipalBiennia: 20,
    });
    expect(result.municipalBienniaAllowance).toBe(180_000);
    expect(result.earnings.find((line) => line.id === "municipal-biennia")?.imposable).toBe(true);
  });

  it("keeps the municipal allowance non-imposable but taxable", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      municipalAllowance: 200_000,
    });
    expect(result.earnings.find((line) => line.id === "municipal-allowance")).toMatchObject({
      imposable: false,
      taxable: true,
    });
  });

  it("adds the non-imposable compensation for pension and health deductions on management pay", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 1_000_000,
      managementAllowanceMonthlyEquivalent: 100_000,
    });
    const compensation = result.earnings.find(
      (line) => line.id === "management-contribution-compensation",
    );
    expect(compensation?.amount).toBeGreaterThan(17_000);
    expect(compensation).toMatchObject({ imposable: false, taxable: true });
  });

  it("counts the management contribution compensation in gross pay for the 2026 bonus", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 640_000,
      managementAllowanceMonthlyEquivalent: 50_000,
    });
    const compensation = result.earnings.find(
      (line) => line.id === "management-contribution-compensation",
    )?.amount ?? 0;
    const expected = Math.round(
      62_903 - 0.71437 * (640_000 + 50_000 + compensation - 673_687),
    );

    expect(compensation).toBeGreaterThan(0);
    expect(result.lowIncomeBonus).toBe(expected);
  });

  it("never charges AFC to plant or municipal contrata", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 1_000_000,
      contractType: "indefinite",
    });
    expect(result.discounts.some((line) => line.id === "afc")).toBe(false);
  });

  it("lets the worker disable the annual low-income bonus when the link is not covered", () => {
    const withBonus = calculateAdministrativeSalary(baseInput);
    const withoutBonus = calculateAdministrativeSalary({
      ...baseInput,
      applyLowIncomeBonus: false,
    });
    expect(withBonus.lowIncomeBonus).toBeGreaterThan(0);
    expect(withoutBonus.lowIncomeBonus).toBe(0);
  });
});
