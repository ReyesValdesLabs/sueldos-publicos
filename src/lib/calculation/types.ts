export type EducationLevel = "basic" | "secondary";
export type Tranche = "access" | "initial" | "early" | "advanced" | "expert1" | "expert2";
export type Afp = "capital" | "cuprum" | "habitat" | "modelo" | "planvital" | "provida" | "uno";
export type HealthSystem = "fonasa" | "isapre";
export type ManualKind = "taxable" | "imposableNonTaxable" | "nonImposable" | "discount";

export interface ManualItem { id: string; name: string; amount: number; kind: ManualKind; countsForMinimum?: boolean }

export interface CalculationInput {
  educationLevel: EducationLevel;
  weeklyHours: number;
  paidBaseSalary?: number;
  biennia: number;
  tranche: Tranche;
  trancheSuspended: boolean;
  hasBrpTitle: boolean;
  hasBrpMention: boolean;
  priorityPercentage: number;
  rural: boolean;
  priorityExpired: boolean;
  zonePercentage: number;
  afp: Afp;
  healthSystem: HealthSystem;
  isaprePlanUf: number;
  apv: number;
  apvTaxDeductible: boolean;
  afcEnabled: boolean;
  contractType: "indefinite" | "fixed";
  manualItems: ManualItem[];
}

export interface ResultLine {
  id: string;
  label: string;
  amount: number;
  imposable: boolean;
  taxable: boolean;
  countsForMinimum: boolean;
  legalSlug?: string;
}

export interface CalculationResult {
  legalRbmn: number;
  earnings: ResultLine[];
  discounts: ResultLine[];
  totalEarnings: number;
  totalDiscounts: number;
  netSalary: number;
  imposableBase: number;
  taxableBase: number;
  minimumTarget: number;
  warnings: string[];
}
