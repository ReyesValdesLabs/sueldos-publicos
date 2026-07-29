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
  managementAllowanceQuarterlyPayment: 0,
  applyLowIncomeBonus: true,
  pensionRegime: "afp",
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
    expect(calculateAdministrativeMinimumIncome(42, "daemCentral")).toBe(553_553);
    expect(calculateAdministrativeMinimumIncome(30, "daemCentral")).toBe(395_395);

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
    expect(calculateAdministrativeSalary({
      ...baseInput,
      regime: "daemCentral",
      weeklyHours: 42,
    }).article59Bonus).toBe(38_320);
    expect(calculateAdministrativeSalary({
      ...baseInput,
      regime: "daemCentral",
      weeklyHours: 30,
    }).article59Bonus).toBe(27_371);
    expect(calculateAdministrativeSalary({ ...baseInput, regime: "municipalStatute" }).article59Bonus).toBe(0);
  });

  it("limits the central DAEM route to the 42-hour ordinary week", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "daemCentral",
      weeklyHours: 44,
    });

    expect(result.article59Bonus).toBe(38_320);
    expect(result.warnings).toContain("La jornada se limitó a 42 horas para este régimen.");
  });

  it("calculates 2% biennia for a municipal plant or contrata appointment, including DAEM destinations", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 600_000,
      municipalBiennia: 1,
    });
    expect(result.municipalBienniaAllowance).toBe(12_000);
    expect(result.earnings.find((line) => line.id === "municipal-biennia")?.imposable).toBe(true);
  });

  it("caps municipal biennia at 15 and does not transfer them to a central DAEM labor contract", () => {
    const capped = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 600_000,
      municipalBiennia: 20,
    });
    const centralLaborContract = calculateAdministrativeSalary({
      ...baseInput,
      regime: "daemCentral",
      baseSalary: 600_000,
      municipalBiennia: 5,
    });

    expect(capped.municipalBienniaAllowance).toBe(180_000);
    expect(centralLaborContract.municipalBienniaAllowance).toBe(0);
    expect(centralLaborContract.earnings.some((line) => line.id === "municipal-biennia")).toBe(false);
  });

  it("uses only completed municipal biennia when receiving a fractional value", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 600_000,
      municipalBiennia: 1.5,
    });

    expect(result.municipalBienniaAllowance).toBe(12_000);
    expect(result.earnings.find((line) => line.id === "municipal-biennia")?.label)
      .toContain("(1 bienio)");
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

  it("adds the non-imposable compensation for the quarterly management payment", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 1_000_000,
      managementAllowanceQuarterlyPayment: 300_000,
    });
    const compensation = result.earnings.find(
      (line) => line.id === "management-contribution-compensation",
    );
    expect(compensation?.amount).toBeGreaterThan(51_000);
    expect(compensation).toMatchObject({ imposable: false, taxable: true });
    expect(result.managementMonthlyEquivalent).toBe(100_000);
  });

  it("uses the full July management payment when testing the 2026 bonus threshold", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 640_000,
      managementAllowanceQuarterlyPayment: 150_000,
    });
    const compensation = result.earnings.find(
      (line) => line.id === "management-contribution-compensation",
    )?.amount ?? 0;
    expect(compensation).toBeGreaterThan(0);
    expect(result.earnings.find((line) => line.id === "management-allowance")?.amount)
      .toBe(150_000);
    expect(result.lowIncomeBonus).toBe(0);
  });

  it("does not let the central DAEM route activate the 2026 low-income bonus", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "daemCentral",
      applyLowIncomeBonus: true,
    });
    expect(result.lowIncomeBonus).toBe(0);
    expect(result.warnings.some((warning) => warning.includes("artículo 13"))).toBe(true);
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

  it.each([
    "educationEstablishment",
    "daemCentral",
    "municipalStatute",
  ] as const)("refuses to calculate AFP deductions for IPS affiliates in %s", (regime) => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime,
      baseSalary: 1_000_000,
      pensionRegime: "ips",
      managementAllowanceQuarterlyPayment: regime === "municipalStatute" ? 300_000 : 0,
    });
    expect(result.supported).toBe(false);
    expect(result.discounts.some((line) => line.id === "afp")).toBe(false);
    expect(result.managementContributionCompensation).toBe(0);
    expect(result.warnings.some((warning) => warning.includes("IPS"))).toBe(true);
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
