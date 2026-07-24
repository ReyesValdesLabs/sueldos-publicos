export type Tranche = "access" | "initial" | "early" | "advanced" | "expert1" | "expert2";
export type Afp = "capital" | "cuprum" | "habitat" | "modelo" | "planvital" | "provida" | "uno";
export type HealthSystem = "fonasa" | "isapre";
export type ManualEarningKind =
  | "imposableTaxable"
  | "imposableNonTaxable"
  | "nonImposableTaxable"
  | "nonImposableNonTaxable";
export type ManualKind = ManualEarningKind | "discount";
export type ResponsibilityRole = "none" | "director" | "otherDirector" | "utpHead" | "otherUtp";
export type BrpEntitlement = "none" | "title" | "titleAndMention" | "normalSchool" | "historicalShortTitleAndMention";

export interface ManualItem { id: string; name: string; amount: number; kind: ManualKind; countsForMinimum?: boolean }

export const isManualEarning = (item: ManualItem): item is ManualItem & { kind: ManualEarningKind } =>
  item.kind !== "discount";

export interface CalculationInput {
  basicHours: number;
  secondaryHours: number;
  paidBaseSalary?: number;
  biennia: number;
  tranche: Tranche | null;
  trancheSuspended: boolean;
  trancheFixedComponentReduced: boolean;
  brpEntitlement: BrpEntitlement;
  priorityPercentage: number;
  rural: boolean;
  priorityExpired: boolean;
  zonePercentage: number;
  responsibilityRole: ResponsibilityRole;
  responsibilityPercentage: number;
  establishmentEnrollment: number;
  afp: Afp;
  healthSystem: HealthSystem;
  isaprePlanUf: number;
  apv: number;
  apvTaxDeductible: boolean;
  afcEnabled: boolean;
  contractType: "indefinite" | "fixed";
  afcContributionEnded: boolean;
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

export const MANUAL_EARNING_TREATMENT: Record<ManualEarningKind, Pick<ResultLine, "imposable" | "taxable">> = {
  imposableTaxable: { imposable: true, taxable: true },
  imposableNonTaxable: { imposable: true, taxable: false },
  nonImposableTaxable: { imposable: false, taxable: true },
  nonImposableNonTaxable: { imposable: false, taxable: false },
};

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
