import type { Afp, HealthSystem, ManualItem, ResultLine } from "@/lib/calculation/types";

export interface AssistantCalculationInput {
  weeklyHours: number;
  countedRemuneration: number;
  biennia: number;
  priorityAllowance: number;
  difficultConditionsPercentage: number;
  zonePercentage: number;
  zonePreviousMonthGross: number;
  territorialAllowance: number;
  academicExcellenceBonus: number;
  law19464Increase: number;
  afp: Afp;
  healthSystem: HealthSystem;
  isaprePlanUf: number;
  apv: number;
  apvTaxDeductible: boolean;
  contractType: "indefinite" | "fixed";
  afcContributionEnded: boolean;
  manualItems: ManualItem[];
}

export interface AssistantCalculationResult {
  minimumTarget: number;
  earnings: ResultLine[];
  discounts: ResultLine[];
  totalEarnings: number;
  totalDiscounts: number;
  netSalary: number;
  imposableBase: number;
  taxableBase: number;
  lowIncomeBonus: number;
  zoneBonus: number;
  warnings: string[];
}
