import type { AdministrativeCalculationInput } from "@/lib/administrative-calculation/types";
import { calculateAdministrativeSalary } from "@/lib/administrative-calculation/calculate";

export function createAdministrativeExampleInput(): AdministrativeCalculationInput {
  return {
    regime: "daemCentral",
    ageBracket: "adult",
    weeklyHours: 42,
    baseSalary: 900000,
    previousMonthGross: 900000,
    law19464Increase: 0,
    localSeniorityAllowance: 0,
    priorityAllowance: 0,
    academicExcellenceBonus: 0,
    difficultConditionsPercentage: 0,
    municipalGrade: 18,
    municipalAllowance: 0,
    municipalBiennia: 0,
    managementAllowanceQuarterlyPayment: 0,
    applyLowIncomeBonus: false,
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
}
export const administrativeExampleResult = calculateAdministrativeSalary(createAdministrativeExampleInput());
