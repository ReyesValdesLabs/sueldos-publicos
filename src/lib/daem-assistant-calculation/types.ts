import type { Afp, HealthSystem, ManualItem, ResultLine } from "@/lib/calculation/types";

export type MinimumIncomeAgeBracket = "adult18To65" | "outside18To65";

export interface DaemAssistantCalculationInput {
  weeklyHours: number;
  minimumIncomeAgeBracket: MinimumIncomeAgeBracket;
  contractRemuneration: number;
  previousMonthGross: number;
  law19464Increase: number;
  localSeniorityAllowance: number;
  priorityAllowance: number;
  academicExcellenceBonus: number;
  difficultConditionsPercentage: number;
  afp: Afp;
  healthSystem: HealthSystem;
  isaprePlanUf: number;
  apv: number;
  apvTaxDeductible: boolean;
  contractType: "indefinite" | "fixed";
  afcContributionEnded: boolean;
  manualItems: ManualItem[];
}

export interface DaemAssistantCalculationResult {
  earnings: ResultLine[];
  discounts: ResultLine[];
  totalEarnings: number;
  totalDiscounts: number;
  netSalary: number;
  imposableBase: number;
  taxableBase: number;
  article59Bonus: number;
  lowIncomeBonus: number;
  warnings: string[];
}
