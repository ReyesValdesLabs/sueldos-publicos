import type { Afp, HealthSystem, ManualItem, ResultLine } from "@/lib/calculation/types";

export type AdministrativeRegime =
  | "educationEstablishment"
  | "daemCentral"
  | "municipalStatute";

export type AdministrativePensionStatus =
  | "afpContributor"
  | "afpOldAgeOrTotalDisabilityPensionerExempt"
  | "afpOldAgeOrTotalDisabilityPensionerContributor"
  | "afpPartialDisabilityPensioner"
  | "ips";
export type AdministrativeAgeBracket = "adult" | "under18" | "over65";

export interface AdministrativeCalculationInput {
  regime: AdministrativeRegime;
  ageBracket: AdministrativeAgeBracket;
  weeklyHours: number;
  baseSalary: number;
  previousMonthGross: number;
  law19464Increase: number;
  localSeniorityAllowance: number;
  priorityAllowance: number;
  academicExcellenceBonus: number;
  difficultConditionsPercentage: number;
  municipalGrade: number;
  municipalAllowance: number;
  municipalBiennia: number;
  managementAllowanceQuarterlyPayment: number;
  applyLowIncomeBonus: boolean;
  pensionStatus: AdministrativePensionStatus;
  afp: Afp;
  healthSystem: HealthSystem;
  isaprePlanUf: number;
  apv: number;
  apvTaxDeductible: boolean;
  contractType: "indefinite" | "fixed";
  afcContributionEnded: boolean;
  manualItems: ManualItem[];
}

export interface AdministrativeCalculationResult {
  supported: boolean;
  calculationComplete: boolean;
  earnings: ResultLine[];
  discounts: ResultLine[];
  totalEarnings: number;
  totalDiscounts: number;
  netSalary: number;
  imposableBase: number;
  taxableBase: number;
  article59Bonus: number;
  lowIncomeBonus: number;
  municipalBienniaAllowance: number;
  warnings: string[];
}
