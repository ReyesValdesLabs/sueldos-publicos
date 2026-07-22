import type { Tranche } from "@/lib/calculation/types";

export type PortfolioCategory = "A" | "B" | "C" | "D" | "E";
export type EcepCategory = "A" | "B" | "C" | "D";

export interface TrancheProgressionInput {
  currentTranche: Tranche;
  experienceYears: number;
  yearsInCurrentTranche: number;
  portfolioCategory: PortfolioCategory;
  ecepCategory: EcepCategory;
  renderedPortfolio: boolean;
  renderedEcep: boolean;
  enteredEarlyWithA: boolean;
  enteredAdvancedWithDoubleA: boolean;
}

export interface TrancheProgressionResult {
  resultTranche: Tranche;
  matrixCeiling: Exclude<Tranche, "access">;
  experienceCeiling: Exclude<Tranche, "access" | "early">;
  progressionCeiling: Exclude<Tranche, "access">;
  permanenceCeiling: Exclude<Tranche, "access">;
  hasCurrentInstrument: boolean;
  advances: boolean;
  reasons: string[];
}

export interface GoalAssessment {
  experience: boolean;
  results: boolean;
  progressionAndPermanence: boolean;
  currentInstrument: boolean;
  reachableNextProcess: boolean;
}
