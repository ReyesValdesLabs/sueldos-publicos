import type { Tranche } from "@/lib/calculation/types";
import type { EcepCategory, GoalAssessment, PortfolioCategory, TrancheProgressionInput, TrancheProgressionResult } from "./types";

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

export function experienceCeiling(years: number): TrancheProgressionResult["experienceCeiling"] {
  if (years < 4) return "initial";
  if (years < 8) return "advanced";
  if (years < 12) return "expert1";
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
  if (input.currentTranche === "advanced") {
    const required = input.enteredAdvancedWithDoubleA ? 2 : 4;
    return input.yearsInCurrentTranche >= required ? "expert2" : "advanced";
  }
  if (input.currentTranche === "expert1") {
    return input.yearsInCurrentTranche >= 4 ? "expert2" : "expert1";
  }
  return "expert2";
}

export function calculateTrancheProgression(input: TrancheProgressionInput): TrancheProgressionResult {
  const matrixCeiling = RESULT_MATRIX[input.portfolioCategory][input.ecepCategory];
  const expCeiling = experienceCeiling(Math.max(0, input.experienceYears));
  const linearCeiling = progressionCeiling(input);
  const tenureCeiling = permanenceCeiling(input);
  const hasCurrentInstrument = input.renderedPortfolio || input.renderedEcep;
  const calculated = minRecognized(matrixCeiling, expCeiling, linearCeiling, tenureCeiling);
  const failsCurrentProcess = hasCurrentInstrument && (
    (input.currentTranche === "initial" && rank(matrixCeiling) <= rank("initial"))
    || (input.currentTranche === "early" && rank(matrixCeiling) < rank("advanced"))
  );
  const mustExit = input.previousProcessWithoutAdvancement && failsCurrentProcess;
  const accessReassigned = input.currentTranche === "access" && input.accessDeadlineExpired && !hasCurrentInstrument;

  let resultTranche: Tranche | null;
  if (mustExit) resultTranche = null;
  else if (accessReassigned) resultTranche = "initial";
  else if (!hasCurrentInstrument) resultTranche = input.currentTranche;
  else if (input.currentTranche === "access") resultTranche = calculated;
  else resultTranche = rank(calculated) > rank(input.currentTranche) ? calculated : input.currentTranche;
  const legalStatus = mustExit ? "exit" : accessReassigned ? "access-reassigned" : "active";

  const reasons: string[] = [];
  if (mustExit) reasons.push(`Este es el segundo proceso consecutivo cuyos resultados no permiten avanzar desde ${TRANCHE_NAMES[input.currentTranche]}; el artículo 19 S dispone la desvinculación.`);
  else if (accessReassigned) reasons.push("Venció el plazo máximo de cuatro años en Acceso sin rendir los instrumentos disponibles; corresponde la asignación a Inicial.");
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
    hasCurrentInstrument,
    advances: legalStatus === "active" && resultTranche !== null && rank(resultTranche) > rank(input.currentTranche),
    legalStatus,
    reasons,
  };
}

export function assessGoal(input: TrancheProgressionInput, target: Exclude<Tranche, "access">): GoalAssessment {
  const targetRank = rank(target);
  const experience = rank(experienceCeiling(input.experienceYears)) >= targetRank;
  const results = rank(RESULT_MATRIX[input.portfolioCategory][input.ecepCategory]) >= targetRank;
  const progressionAndPermanence = rank(progressionCeiling(input)) >= targetRank && rank(permanenceCeiling(input)) >= targetRank;
  const currentInstrument = input.renderedPortfolio || input.renderedEcep;
  const legalContinuity = calculateTrancheProgression(input).legalStatus !== "exit";
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
  switch (target) {
    case "initial": return "C + D o cualquier combinación superior";
    case "early": return "B + D, C + C o cualquier combinación superior";
    case "advanced": return "B + C, C + B o cualquier combinación superior";
    case "expert1": return "A + C, B + B, C + A o cualquier combinación superior";
    case "expert2": return "A + B, B + A o A + A";
  }
}

export function nextGoal(current: Tranche): Exclude<Tranche, "access"> {
  if (current === "access") return "initial";
  const currentIndex = recognizedOrder.indexOf(current);
  return recognizedOrder[Math.min(recognizedOrder.length - 1, currentIndex + 1)];
}
