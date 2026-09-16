import type { AssistantCalculationInput } from "@/lib/assistant-calculation/types";
import { calculateAssistantSalary } from "@/lib/assistant-calculation/calculate";
import { JULY_2026_ASSISTANT_PARAMETERS as A } from "@/data/parameters/assistants-2026-07";

export function createAssistantExampleInput(): AssistantCalculationInput {
  return {
    weeklyHours: 44,
    countedRemuneration: A.technicalMinimum44h,
    biennia: 2,
    priorityAllowance: 0,
    difficultConditionsPercentage: 0,
    zonePercentage: 0,
    zonePreviousMonthGross: 0,
    territorialAllowance: 0,
    academicExcellenceBonus: 0,
    law19464Increase: 0,
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
export const assistantExampleResult = calculateAssistantSalary(createAssistantExampleInput());
