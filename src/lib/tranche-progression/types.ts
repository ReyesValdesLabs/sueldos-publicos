import type { Tranche } from "@/lib/calculation/types";

export type PortfolioCategory = "A" | "B" | "C" | "D" | "E";
export type EcepCategory = "A" | "B" | "C" | "D";

export type PortfolioResult =
  | { category: PortfolioCategory; status: "rendered" }
  | { category: "A"; status: "retained-a-next-process" }
  | { category: "B"; status: "retained-consecutive-b-next-process" };

export type EcepResult =
  | { category: EcepCategory; status: "rendered" }
  | { category: "A" | "B"; status: "retained-following-process" };

export type Article19SHistory =
  | {
    kind: "ordinary";
    systemEntryCohort: "before-2025" | "from-2025";
    previousProcessWithoutAdvancement: boolean;
  }
  | {
    kind: "reentry-from-2025-after-early-exit";
    evaluationAttempt: "first" | "second";
    reentryEvaluationDue: boolean;
  };

export type Article19SExitConsequence =
  | "ordinary-initial-all-system"
  | "ordinary-early-loss-and-two-year-wait"
  | "reentry-first-same-sponsor"
  | "reentry-second-all-system";

export interface TrancheProgressionInput {
  currentTranche: Tranche;
  experienceYears: number;
  yearsInCurrentTranche: number;
  portfolioResult: PortfolioResult;
  ecepResult: EcepResult;
  enteredEarlyWithA: boolean;
  enteredAdvancedWithDoubleA: boolean;
  article19SHistory: Article19SHistory;
  accessDeadlineExpired: boolean;
}

export interface TrancheProgressionResult {
  resultTranche: Tranche | null;
  matrixCeiling: Exclude<Tranche, "access">;
  experienceCeiling: Exclude<Tranche, "access" | "early">;
  progressionCeiling: Exclude<Tranche, "access">;
  permanenceCeiling: Exclude<Tranche, "access">;
  article19SHistoryValid: boolean;
  instrumentResultsValid: boolean;
  hasCurrentInstrument: boolean;
  advances: boolean;
  legalStatus: "active" | "access-reassigned" | "exit";
  exitConsequence: Article19SExitConsequence | null;
  reasons: string[];
}

export interface GoalAssessment {
  experience: boolean;
  results: boolean;
  progressionAndPermanence: boolean;
  currentInstrument: boolean;
  legalContinuity: boolean;
  reachableNextProcess: boolean;
}
