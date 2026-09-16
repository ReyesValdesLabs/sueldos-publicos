import type { CalculationInput } from "@/lib/calculation/types";
import { calculateTeacherSalary } from "@/lib/calculation/calculate";
import { JULY_2026_PARAMETERS as P } from "@/data/parameters/2026-07";

// Every field is explicit so loading the example cannot inherit a previous simulation.
export function createTeacherExampleInput(): CalculationInput {
  return {
    basicHours: 20, secondaryHours: 24, biennia: 3, tranche: "advanced",
    trancheSuspended: false, trancheFixedComponentReduced: false,
    brpEntitlement: "titleAndMention", priorityPercentage: 0, rural: false,
    priorityExpired: false, zonePercentage: 0, responsibilityRole: "none",
    responsibilityAppointment: "regular", responsibilityPercentage: 0,
    establishmentEnrollment: 0, afp: "habitat", healthSystem: "fonasa",
    isaprePlanUf: 0, apv: 0, apvTaxDeductible: false, afcEnabled: false,
    contractType: "indefinite", afcContributionEnded: false, manualItems: [],
  };
}

export const teacherExampleResult = calculateTeacherSalary(createTeacherExampleInput(), P);
export const TEACHER_EXAMPLE_REVIEWED_AT = "2026-09-15";
