import type { TrancheProgressionInput } from "@/lib/tranche-progression/types";
import { calculateTrancheProgression } from "@/lib/tranche-progression/calculate";

export function createTrancheExampleInput(): TrancheProgressionInput {
  return {
    currentTranche: "initial",
    experienceYears: 4,
    yearsInCurrentTranche: 0,
    portfolioResult: { category: "A", status: "rendered" },
    ecepResult: { category: "B", status: "rendered" },
    enteredEarlyWithA: false,
    enteredAdvancedWithDoubleA: false,
    article19SHistory: {
      kind: "ordinary",
      systemEntryCohort: "before-2025",
      previousProcessWithoutAdvancement: false,
    },
    accessDeadlineExpired: false,
  };
}
export const trancheExampleResult = calculateTrancheProgression(createTrancheExampleInput());
