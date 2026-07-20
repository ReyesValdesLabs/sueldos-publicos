import { describe, expect, it } from "vitest";
import { JULY_2026_PARAMETERS as P } from "@/data/parameters/2026-07";
import { calculateTeacherSalary, experiencePercentage } from "./calculate";
import type { CalculationInput } from "./types";

const baseInput: CalculationInput = {
  educationLevel: "basic",
  weeklyHours: 44,
  biennia: 0,
  tranche: "access",
  trancheSuspended: false,
  hasBrpTitle: false,
  hasBrpMention: false,
  priorityPercentage: 0,
  rural: false,
  priorityExpired: false,
  zonePercentage: 0,
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

describe("calculateTeacherSalary", () => {
  it("calculates the legal RBMN independently from an edited paid base", () => {
    const result = calculateTeacherSalary({ ...baseInput, paidBaseSalary: 1_200_000, biennia: 1 });
    expect(result.legalRbmn).toBe(P.hourlyRate.basic * 44);
    expect(result.earnings.find((line) => line.id === "base")?.amount).toBe(1_200_000);
    expect(result.earnings.find((line) => line.id === "experience")?.amount).toBe(Math.round(result.legalRbmn * 0.0338));
    expect(result.warnings).toContain("El sueldo base fue editado. Las asignaciones legales siguen usando la RBMN oficial.");
  });

  it("caps BRP proportionality at 30 hours", () => {
    const at30 = calculateTeacherSalary({ ...baseInput, weeklyHours: 30, hasBrpTitle: true });
    const at44 = calculateTeacherSalary({ ...baseInput, weeklyHours: 44, hasBrpTitle: true });
    expect(at30.earnings.find((line) => line.id === "brp-title")?.amount).toBe(P.brp.title);
    expect(at44.earnings.find((line) => line.id === "brp-title")?.amount).toBe(P.brp.title);
  });

  it("treats zone as imposable but not taxable", () => {
    const result = calculateTeacherSalary({ ...baseInput, zonePercentage: 40 });
    const zone = result.earnings.find((line) => line.id === "zone");
    expect(zone?.amount).toBe(Math.round(result.legalRbmn * 0.4));
    expect(zone?.imposable).toBe(true);
    expect(zone?.taxable).toBe(false);
  });

  it("adds the rural priority benefit from 45% concentration", () => {
    const withoutRural = calculateTeacherSalary({ ...baseInput, priorityPercentage: 50 });
    const withRural = calculateTeacherSalary({ ...baseInput, priorityPercentage: 50, rural: true, biennia: 15, tranche: "advanced" });
    expect(withoutRural.earnings.some((line) => line.id === "priority")).toBe(false);
    expect(withRural.earnings.find((line) => line.id === "priority")?.amount).toBeGreaterThan(0);
  });

  it("adds a complementary amount when computable earnings are below RTM", () => {
    const result = calculateTeacherSalary({ ...baseInput, weeklyHours: 1, paidBaseSalary: 0, trancheSuspended: true });
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
});
