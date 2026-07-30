import { describe, expect, it } from "vitest";
import { JULY_2026_PARAMETERS as P } from "@/data/parameters/2026-07";
import type { AdministrativeCalculationInput } from "./types";
import {
  calculateAdministrativeMinimumIncome,
  calculateAdministrativeSalary,
} from "./calculate";

const baseInput: AdministrativeCalculationInput = {
  regime: "educationEstablishment",
  ageBracket: "adult",
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
  pensionStatus: "afpContributor",
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
  it("uses the full age-bracket IMM for every valid establishment schedule", () => {
    expect(calculateAdministrativeMinimumIncome(44)).toBe(553_553);
    expect(calculateAdministrativeMinimumIncome(30)).toBe(553_553);
    expect(calculateAdministrativeMinimumIncome(1)).toBe(553_553);
    expect(calculateAdministrativeMinimumIncome(
      1,
      "educationEstablishment",
      "under18",
    )).toBe(412_938);
  });

  it("prorates the central DAEM IMM up to 30 hours over 42 and uses the full amount above that", () => {
    expect(calculateAdministrativeMinimumIncome(42, "daemCentral")).toBe(553_553);
    expect(calculateAdministrativeMinimumIncome(30, "daemCentral")).toBe(395_395);
    expect(calculateAdministrativeMinimumIncome(31, "daemCentral")).toBe(553_553);
    expect(calculateAdministrativeMinimumIncome(
      30,
      "daemCentral",
      "over65",
    )).toBe(294_956);
  });

  it("does not apply the Code of Labor IMM test to municipal statute appointments", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 300_000,
    });
    expect(result.warnings.some((warning) => warning.includes("ingreso mínimo"))).toBe(false);
    expect(calculateAdministrativeMinimumIncome(44, "municipalStatute")).toBe(0);
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

  it("keeps the quarterly management payment without inferring historical reliquidations", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 1_000_000,
      managementAllowanceQuarterlyPayment: 300_000,
    });
    expect(result.earnings.find((line) => line.id === "management-allowance")?.amount)
      .toBe(300_000);
    expect(result.earnings.some(
      (line) => line.id === "management-contribution-compensation",
    )).toBe(false);
    expect(result.calculationComplete).toBe(false);
    expect(result.warnings.some((warning) => warning.includes("subtotal líquido antes de reliquidaciones")))
      .toBe(true);
  });

  it("uses the full July management payment when testing the 2026 bonus threshold", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      regime: "municipalStatute",
      baseSalary: 640_000,
      managementAllowanceQuarterlyPayment: 150_000,
    });
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
      pensionStatus: "ips",
      managementAllowanceQuarterlyPayment: regime === "municipalStatute" ? 300_000 : 0,
    });
    expect(result.supported).toBe(false);
    expect(result.discounts.some((line) => line.id === "afp")).toBe(false);
    expect(result.warnings.some((warning) => warning.includes("IPS"))).toBe(true);
  });

  it("uses the reduced minimum and excludes minors from AFC", () => {
    expect(calculateAdministrativeMinimumIncome(
      44,
      "educationEstablishment",
      "under18",
    )).toBe(412_938);
    const result = calculateAdministrativeSalary({
      ...baseInput,
      ageBracket: "under18",
      baseSalary: 412_938,
      previousMonthGross: 600_000,
    });
    expect(result.warnings.some((warning) => warning.includes("inferior al ingreso mínimo")))
      .toBe(false);
    expect(result.discounts.some((line) => line.id === "afc")).toBe(false);
    expect(result.warnings.some((warning) => warning.includes("menores de 18 años")))
      .toBe(true);
  });

  it("uses the reduced minimum for people over 65 without assuming an AFC exemption", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      ageBracket: "over65",
      baseSalary: 412_938,
      previousMonthGross: 600_000,
    });
    expect(result.warnings.some((warning) => warning.includes("inferior al ingreso mínimo")))
      .toBe(false);
    expect(result.discounts.some((line) => line.id === "afc")).toBe(true);
    expect(result.discounts.find((line) => line.id === "afp")?.amount).toBeGreaterThan(0);
  });

  it("keeps health but removes AFP and AFC only when an eligible pensioner declares the exemption", () => {
    const ordinary = calculateAdministrativeSalary({
      ...baseInput,
      baseSalary: 1_000_000,
      previousMonthGross: 1_000_000,
    });
    const exemptPensioner = calculateAdministrativeSalary({
      ...baseInput,
      baseSalary: 1_000_000,
      previousMonthGross: 1_000_000,
      pensionStatus: "afpOldAgeOrTotalDisabilityPensionerExempt",
    });

    expect(exemptPensioner.supported).toBe(true);
    expect(exemptPensioner.discounts.find((line) => line.id === "afp")?.amount).toBe(0);
    expect(exemptPensioner.discounts.find((line) => line.id === "health")?.amount)
      .toBe(ordinary.discounts.find((line) => line.id === "health")?.amount);
    expect(exemptPensioner.discounts.some((line) => line.id === "afc")).toBe(false);
    expect(exemptPensioner.warnings.some((warning) => warning.includes("exención correspondiente")))
      .toBe(true);
  });

  it("keeps an AFP partial-disability pensioner as an ordinary contributor", () => {
    const result = calculateAdministrativeSalary({
      ...baseInput,
      baseSalary: 1_000_000,
      previousMonthGross: 1_000_000,
      pensionStatus: "afpPartialDisabilityPensioner",
    });

    expect(result.discounts.find((line) => line.id === "afp")?.amount).toBeGreaterThan(0);
    expect(result.discounts.find((line) => line.id === "health")?.amount).toBeGreaterThan(0);
    expect(result.discounts.find((line) => line.id === "afc")?.amount).toBeGreaterThan(0);
    expect(result.warnings.some((warning) => warning.includes("invalidez parcial"))).toBe(true);
  });

  it("deducts Isapre contributions from tax only up to 7% of the pension cap", () => {
    const taxableEarning = {
      id: "high-income",
      name: "Renta alta",
      amount: 5_000_000,
      kind: "imposableTaxable" as const,
    };
    const fonasa = calculateAdministrativeSalary({
      ...baseInput,
      baseSalary: 1_000_000,
      previousMonthGross: 1_000_000,
      manualItems: [taxableEarning],
    });
    const isapreBelowCap = calculateAdministrativeSalary({
      ...baseInput,
      baseSalary: 1_000_000,
      previousMonthGross: 1_000_000,
      healthSystem: "isapre",
      isaprePlanUf: 6,
      manualItems: [{ ...taxableEarning, amount: 2_000_000 }],
    });
    const isapreAboveCap = calculateAdministrativeSalary({
      ...baseInput,
      baseSalary: 1_000_000,
      previousMonthGross: 1_000_000,
      healthSystem: "isapre",
      isaprePlanUf: 8,
      manualItems: [taxableEarning],
    });
    const healthTaxCap = Math.round(P.pensionCapUf * P.uf * 0.07);

    expect(fonasa.taxableBase).toBe(
      fonasa.earnings.filter((line) => line.taxable).reduce((total, line) => total + line.amount, 0)
      - fonasa.discounts.find((line) => line.id === "afp")!.amount
      - Math.round(fonasa.imposableBase * 0.07)
      - fonasa.discounts.find((line) => line.id === "afc")!.amount,
    );
    expect(isapreBelowCap.taxableBase).toBe(
      isapreBelowCap.earnings.filter((line) => line.taxable).reduce((total, line) => total + line.amount, 0)
      - isapreBelowCap.discounts.find((line) => line.id === "afp")!.amount
      - Math.round(6 * P.uf)
      - isapreBelowCap.discounts.find((line) => line.id === "afc")!.amount,
    );
    expect(isapreAboveCap.taxableBase).toBe(
      isapreAboveCap.earnings.filter((line) => line.taxable).reduce((total, line) => total + line.amount, 0)
      - isapreAboveCap.discounts.find((line) => line.id === "afp")!.amount
      - healthTaxCap
      - isapreAboveCap.discounts.find((line) => line.id === "afc")!.amount,
    );
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
