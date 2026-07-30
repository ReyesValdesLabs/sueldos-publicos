import type { Tranche } from "@/lib/calculation/types";
import type { EcepCategory, EcepResult, GoalAssessment, PortfolioCategory, PortfolioResult, TrancheProgressionInput, TrancheProgressionResult } from "./types";

export const TRANCHE_NAMES: Record<Tranche, string> = {
  access: "Acceso",
  initial: "Inicial",
  early: "Temprano",
  advanced: "Avanzado",
  expert1: "Experto I",
  expert2: "Experto II",
};

export const TRANCHE_ORDER: Tranche[] = ["access", "initial", "early", "advanced", "expert1", "expert2"];
const recognizedOrder: Exclude<Tranche, "access">[] = ["initial", "early", "advanced", "expert1", "expert2"];

export const RESULT_MATRIX: Record<PortfolioCategory, Record<EcepCategory, Exclude<Tranche, "access">>> = {
  A: { A: "expert2", B: "expert2", C: "expert1", D: "early" },
  B: { A: "expert2", B: "expert1", C: "advanced", D: "early" },
  C: { A: "expert1", B: "advanced", C: "early", D: "initial" },
  D: { A: "early", B: "early", C: "initial", D: "initial" },
  E: { A: "initial", B: "initial", C: "initial", D: "initial" },
};

function rank(tranche: Tranche) {
  return TRANCHE_ORDER.indexOf(tranche);
}

function minRecognized(...tranches: Exclude<Tranche, "access">[]) {
  return tranches.reduce((lowest, tranche) => rank(tranche) < rank(lowest) ? tranche : lowest);
}

export function isValidPortfolioResult(result: PortfolioResult): boolean {
  return result.status === "rendered"
    || (result.status === "retained-a-next-process" && result.category === "A")
    || (result.status === "retained-consecutive-b-next-process" && result.category === "B");
}

export function isValidEcepResult(result: EcepResult): boolean {
  return result.status === "rendered"
    || (result.status === "retained-following-process" && (result.category === "A" || result.category === "B"));
}

export function experienceCeiling(years: number): TrancheProgressionResult["experienceCeiling"] {
  const safeYears = Number.isFinite(years) && years > 0 ? years : 0;
  if (safeYears < 4) return "initial";
  if (safeYears < 8) return "advanced";
  if (safeYears < 12) return "expert1";
  return "expert2";
}

export function progressionCeiling(input: TrancheProgressionInput): TrancheProgressionResult["progressionCeiling"] {
  switch (input.currentTranche) {
    case "access": return "expert2";
    case "initial": return "advanced";
    case "early": return input.enteredEarlyWithA ? "expert1" : "advanced";
    case "advanced": return "expert1";
    case "expert1": return "expert2";
    case "expert2": return "expert2";
  }
}

export function permanenceCeiling(input: TrancheProgressionInput): TrancheProgressionResult["permanenceCeiling"] {
  const yearsInCurrentTranche = Number.isFinite(input.yearsInCurrentTranche)
    && input.yearsInCurrentTranche > 0
    ? input.yearsInCurrentTranche
    : 0;
  if (input.currentTranche === "advanced") {
    const required = input.enteredAdvancedWithDoubleA ? 2 : 4;
    return yearsInCurrentTranche >= required ? "expert2" : "advanced";
  }
  if (input.currentTranche === "expert1") {
    return yearsInCurrentTranche >= 4 ? "expert2" : "expert1";
  }
  return "expert2";
}

export function calculateTrancheProgression(input: TrancheProgressionInput): TrancheProgressionResult {
  const matrixCeiling = RESULT_MATRIX[input.portfolioResult.category][input.ecepResult.category];
  const expCeiling = experienceCeiling(input.experienceYears);
  const linearCeiling = progressionCeiling(input);
  const tenureCeiling = permanenceCeiling(input);
  const instrumentResultsValid = isValidPortfolioResult(input.portfolioResult) && isValidEcepResult(input.ecepResult);
  const hasCurrentInstrument = instrumentResultsValid && (
    input.portfolioResult.status === "rendered" || input.ecepResult.status === "rendered"
  );
  const article19SHistoryValid = input.article19SHistory.kind === "ordinary"
    || input.article19SHistory.evaluationAttempt === "second"
    || input.currentTranche === "initial";
  const calculated = minRecognized(matrixCeiling, expCeiling, linearCeiling, tenureCeiling);
  const failsCurrentProcess = hasCurrentInstrument && (
    (input.currentTranche === "initial" && rank(matrixCeiling) <= rank("initial"))
    || (input.currentTranche === "early" && rank(matrixCeiling) < rank("advanced"))
  );
  const mustExitOrdinaryInitial = input.currentTranche === "initial"
    && input.article19SHistory.kind === "ordinary"
    && input.article19SHistory.previousProcessWithoutAdvancement
    && failsCurrentProcess;
  const mustExitOrdinaryEarly = input.currentTranche === "early"
    && input.article19SHistory.kind === "ordinary"
    && input.article19SHistory.systemEntryCohort === "from-2025"
    && input.article19SHistory.previousProcessWithoutAdvancement
    && failsCurrentProcess;
  const mustExitAfterReentry = (input.currentTranche === "initial" || input.currentTranche === "early")
    && input.article19SHistory.kind === "reentry-from-2025-after-early-exit"
    && article19SHistoryValid
    && input.article19SHistory.reentryEvaluationDue
    && failsCurrentProcess;
  const mustExit = mustExitOrdinaryInitial || mustExitOrdinaryEarly || mustExitAfterReentry;
  const exitConsequence = mustExitOrdinaryInitial
    ? "ordinary-initial-all-system"
    : mustExitOrdinaryEarly
      ? "ordinary-early-loss-and-two-year-wait"
      : mustExitAfterReentry && input.article19SHistory.kind === "reentry-from-2025-after-early-exit"
        ? input.article19SHistory.evaluationAttempt === "first"
          ? "reentry-first-same-sponsor"
          : "reentry-second-all-system"
        : null;
  const accessReassigned = input.currentTranche === "access" && input.accessDeadlineExpired && !hasCurrentInstrument;

  let resultTranche: Tranche | null;
  if (mustExit) resultTranche = null;
  else if (accessReassigned) resultTranche = "initial";
  else if (!article19SHistoryValid) resultTranche = input.currentTranche;
  else if (!instrumentResultsValid) resultTranche = input.currentTranche;
  else if (!hasCurrentInstrument) resultTranche = input.currentTranche;
  else if (input.currentTranche === "access") resultTranche = calculated;
  else resultTranche = rank(calculated) > rank(input.currentTranche) ? calculated : input.currentTranche;
  const legalStatus = mustExit ? "exit" : accessReassigned ? "access-reassigned" : "active";

  const reasons: string[] = [];
  if (!article19SHistoryValid) reasons.push("La primera evaluación posterior al reingreso solo puede declararse mientras el tramo actual es Inicial.");
  else if (exitConsequence === "reentry-first-same-sponsor") reasons.push("La primera evaluación posterior al reingreso no permite avanzar de tramo; corresponde la desvinculación y la prohibición de contratación alcanza al mismo sostenedor.");
  else if (exitConsequence === "reentry-second-all-system") reasons.push("La segunda evaluación desde el reingreso no permite avanzar de tramo; corresponde la desvinculación y la prohibición de contratación alcanza a los establecimientos regidos por este Título.");
  else if (exitConsequence === "ordinary-early-loss-and-two-year-wait") reasons.push("Este es el segundo proceso consecutivo cuyos resultados no permiten acceder a Avanzado desde Temprano; corresponde la desvinculación, la pérdida del tramo y la antigüedad, y el reingreso solo puede ocurrir después de dos años.");
  else if (mustExit) reasons.push(`Este es el segundo proceso consecutivo cuyos resultados no permiten avanzar desde ${TRANCHE_NAMES[input.currentTranche]}; el artículo 19 S dispone la desvinculación.`);
  else if (accessReassigned) reasons.push("Venció el plazo máximo de cuatro años en Acceso sin rendir los instrumentos disponibles; corresponde la asignación a Inicial.");
  else if (!instrumentResultsValid) reasons.push("La categoría declarada no habilita conservar este resultado según el artículo 19 Ñ.");
  else if (!hasCurrentInstrument) reasons.push("Debes rendir al menos uno de los dos instrumentos en este proceso.");
  if (rank(expCeiling) < rank(matrixCeiling)) reasons.push(`La experiencia limita el resultado a ${TRANCHE_NAMES[expCeiling]}.`);
  if (rank(linearCeiling) < rank(matrixCeiling)) reasons.push(`La progresión permitida desde ${TRANCHE_NAMES[input.currentTranche]} limita el avance a ${TRANCHE_NAMES[linearCeiling]}.`);
  if (rank(tenureCeiling) < rank(matrixCeiling)) reasons.push(`La permanencia en ${TRANCHE_NAMES[input.currentTranche]} limita el avance a ${TRANCHE_NAMES[tenureCeiling]}.`);
  if (!mustExit && input.currentTranche !== "access" && rank(calculated) < rank(input.currentTranche)) reasons.push("El sistema conserva el tramo ya reconocido: no hay retroceso, salvo las causales de salida del artículo 19 S.");

  return {
    resultTranche,
    matrixCeiling,
    experienceCeiling: expCeiling,
    progressionCeiling: linearCeiling,
    permanenceCeiling: tenureCeiling,
    article19SHistoryValid,
    instrumentResultsValid,
    hasCurrentInstrument,
    advances: article19SHistoryValid && instrumentResultsValid && legalStatus === "active" && resultTranche !== null && rank(resultTranche) > rank(input.currentTranche),
    legalStatus,
    exitConsequence,
    reasons,
  };
}

export function assessGoal(input: TrancheProgressionInput, target: Exclude<Tranche, "access">): GoalAssessment {
  const targetRank = rank(target);
  const experience = rank(experienceCeiling(input.experienceYears)) >= targetRank;
  const validResults = isValidPortfolioResult(input.portfolioResult) && isValidEcepResult(input.ecepResult);
  const results = validResults && rank(RESULT_MATRIX[input.portfolioResult.category][input.ecepResult.category]) >= targetRank;
  const progressionAndPermanence = rank(progressionCeiling(input)) >= targetRank && rank(permanenceCeiling(input)) >= targetRank;
  const currentInstrument = validResults && (
    input.portfolioResult.status === "rendered" || input.ecepResult.status === "rendered"
  );
  const progression = calculateTrancheProgression(input);
  const legalContinuity = progression.article19SHistoryValid && progression.legalStatus !== "exit";
  return {
    experience,
    results,
    progressionAndPermanence,
    currentInstrument,
    legalContinuity,
    reachableNextProcess: experience && results && progressionAndPermanence && currentInstrument && legalContinuity,
  };
}

export function minimumExperienceFor(target: Exclude<Tranche, "access">) {
  if (target === "early" || target === "advanced") return 4;
  if (target === "expert1") return 8;
  if (target === "expert2") return 12;
  return 0;
}

export function minimumCombinationFor(target: Exclude<Tranche, "access">) {
  if (target === "initial") return "cualquier combinación válida de la matriz";
  return `cualquier combinación cuya celda sea ${TRANCHE_NAMES[target]} o superior`;
}

export function nextGoal(current: Tranche): Exclude<Tranche, "access"> {
  if (current === "access") return "initial";
  const currentIndex = recognizedOrder.indexOf(current);
  return recognizedOrder[Math.min(recognizedOrder.length - 1, currentIndex + 1)];
}
