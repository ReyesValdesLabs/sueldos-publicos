import { describe, expect, it } from "vitest";
import { RESULT_MATRIX, assessGoal, calculateTrancheProgression, experienceCeiling, isValidEcepResult, isValidPortfolioResult, minimumCombinationFor, minimumExperienceFor } from "./calculate";
import type { TrancheProgressionInput } from "./types";

const base: TrancheProgressionInput = {
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

describe("matriz oficial de resultados", () => {
  it("contiene las veinte combinaciones esperadas", () => {
    expect(RESULT_MATRIX).toEqual({
      A: { A: "expert2", B: "expert2", C: "expert1", D: "early" },
      B: { A: "expert2", B: "expert1", C: "advanced", D: "early" },
      C: { A: "expert1", B: "advanced", C: "early", D: "initial" },
      D: { A: "early", B: "early", C: "initial", D: "initial" },
      E: { A: "initial", B: "initial", C: "initial", D: "initial" },
    });
  });
});

describe("cálculo de progresión", () => {
  it("aplica los umbrales de experiencia", () => {
    expect([3, 4, 7, 8, 11, 12].map(experienceCeiling)).toEqual(["initial", "advanced", "advanced", "expert1", "expert1", "expert2"]);
    expect(minimumExperienceFor("early")).toBe(4);
  });

  it("normaliza experiencia no finita o negativa", () => {
    expect([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1].map(experienceCeiling)).toEqual([
      "initial",
      "initial",
      "initial",
      "initial",
    ]);
  });

  it("permite la excepción de Inicial a Avanzado", () => {
    expect(calculateTrancheProgression(base).resultTranche).toBe("advanced");
  });

  it("aplica linealidad ordinaria desde Temprano", () => {
    expect(calculateTrancheProgression({ ...base, currentTranche: "early", experienceYears: 8 }).resultTranche).toBe("advanced");
  });

  it("permite Temprano a Experto I si ingresó con una A", () => {
    expect(calculateTrancheProgression({ ...base, currentTranche: "early", experienceYears: 8, enteredEarlyWithA: true }).resultTranche).toBe("expert1");
  });

  it("exige permanencia en Avanzado y aplica la excepción A+A de dos años", () => {
    expect(calculateTrancheProgression({ ...base, currentTranche: "advanced", experienceYears: 8, yearsInCurrentTranche: 3 }).resultTranche).toBe("advanced");
    expect(calculateTrancheProgression({ ...base, currentTranche: "advanced", experienceYears: 8, yearsInCurrentTranche: 2, enteredAdvancedWithDoubleA: true }).resultTranche).toBe("expert1");
  });

  it("exige cuatro años en Experto I para avanzar a Experto II", () => {
    expect(calculateTrancheProgression({ ...base, currentTranche: "expert1", experienceYears: 12, yearsInCurrentTranche: 3 }).resultTranche).toBe("expert1");
    expect(calculateTrancheProgression({ ...base, currentTranche: "expert1", experienceYears: 12, yearsInCurrentTranche: 4 }).resultTranche).toBe("expert2");
  });

  it("no retrocede y exige rendir al menos un instrumento", () => {
    expect(calculateTrancheProgression({
      ...base,
      currentTranche: "advanced",
      portfolioResult: { category: "E", status: "rendered" },
      ecepResult: { category: "D", status: "rendered" },
    }).resultTranche).toBe("advanced");
    expect(calculateTrancheProgression({
      ...base,
      currentTranche: "advanced",
      portfolioResult: { category: "B", status: "retained-consecutive-b-next-process" },
      ecepResult: { category: "D", status: "rendered" },
    })).toMatchObject({ resultTranche: "advanced", hasCurrentInstrument: true });
    const noInstrument = calculateTrancheProgression({
      ...base,
      portfolioResult: { category: "A", status: "retained-a-next-process" },
      ecepResult: { category: "B", status: "retained-following-process" },
    });
    expect(noInstrument.resultTranche).toBe("initial");
    expect(noInstrument.hasCurrentInstrument).toBe(false);
  });

  it("assigns Access to Initial when the four-year deadline expires without instruments", () => {
    const result = calculateTrancheProgression({
      ...base,
      currentTranche: "access",
      portfolioResult: { category: "A", status: "retained-a-next-process" },
      ecepResult: { category: "B", status: "retained-following-process" },
      accessDeadlineExpired: true,
    });
    expect(result).toMatchObject({ resultTranche: "initial", legalStatus: "access-reassigned", advances: false });
  });

  it("aplica la salida ordinaria en Inicial y en Temprano solo para cohortes desde 2025", () => {
    const insufficientResults = {
      portfolioResult: { category: "E", status: "rendered" },
      ecepResult: { category: "D", status: "rendered" },
    } as const;
    const initialExit = calculateTrancheProgression({
      ...base,
      ...insufficientResults,
      article19SHistory: { kind: "ordinary", systemEntryCohort: "before-2025", previousProcessWithoutAdvancement: true },
    });
    const earlyBefore2025 = calculateTrancheProgression({
      ...base,
      ...insufficientResults,
      currentTranche: "early",
      article19SHistory: { kind: "ordinary", systemEntryCohort: "before-2025", previousProcessWithoutAdvancement: true },
    });
    const earlyExit = calculateTrancheProgression({
      ...base,
      ...insufficientResults,
      currentTranche: "early",
      article19SHistory: { kind: "ordinary", systemEntryCohort: "from-2025", previousProcessWithoutAdvancement: true },
    });
    expect(initialExit).toMatchObject({ resultTranche: null, legalStatus: "exit", advances: false });
    expect(earlyBefore2025).toMatchObject({ resultTranche: "early", legalStatus: "active", advances: false });
    expect(earlyExit).toMatchObject({ resultTranche: null, legalStatus: "exit", advances: false });
    expect(assessGoal({
      ...base,
      ...insufficientResults,
      article19SHistory: { kind: "ordinary", systemEntryCohort: "before-2025", previousProcessWithoutAdvancement: true },
    }, "advanced").legalContinuity).toBe(false);
  });

  it("distingue la primera y segunda evaluación después del reingreso", () => {
    const first = calculateTrancheProgression({
      ...base,
      portfolioResult: { category: "E", status: "rendered" },
      ecepResult: { category: "D", status: "rendered" },
      article19SHistory: {
        kind: "reentry-from-2025-after-early-exit",
        evaluationAttempt: "first",
        reentryEvaluationDue: true,
      },
    });
    const secondFromInitial = calculateTrancheProgression({
      ...base,
      portfolioResult: { category: "E", status: "rendered" },
      ecepResult: { category: "D", status: "rendered" },
      article19SHistory: {
        kind: "reentry-from-2025-after-early-exit",
        evaluationAttempt: "second",
        reentryEvaluationDue: true,
      },
    });
    const secondFromEarly = calculateTrancheProgression({
      ...base,
      currentTranche: "early",
      portfolioResult: { category: "E", status: "rendered" },
      ecepResult: { category: "D", status: "rendered" },
      article19SHistory: {
        kind: "reentry-from-2025-after-early-exit",
        evaluationAttempt: "second",
        reentryEvaluationDue: true,
      },
    });

    expect(first).toMatchObject({
      resultTranche: null,
      legalStatus: "exit",
      exitConsequence: "reentry-first-same-sponsor",
    });
    expect(secondFromInitial).toMatchObject({
      resultTranche: null,
      legalStatus: "exit",
      exitConsequence: "reentry-second-all-system",
    });
    expect(secondFromEarly).toMatchObject({
      resultTranche: null,
      legalStatus: "exit",
      exitConsequence: "reentry-second-all-system",
    });
  });

  it("no aplica la salida cuando la evaluación de reingreso aún no corresponde", () => {
    expect(calculateTrancheProgression({
      ...base,
      portfolioResult: { category: "E", status: "rendered" },
      ecepResult: { category: "D", status: "rendered" },
      article19SHistory: {
        kind: "reentry-from-2025-after-early-exit",
        evaluationAttempt: "first",
        reentryEvaluationDue: false,
      },
    })).toMatchObject({ legalStatus: "active", resultTranche: "initial", exitConsequence: null });
  });

  it("rechaza una primera evaluación de reingreso declarada fuera de Inicial", () => {
    const result = calculateTrancheProgression({
      ...base,
      currentTranche: "early",
      article19SHistory: {
        kind: "reentry-from-2025-after-early-exit",
        evaluationAttempt: "first",
        reentryEvaluationDue: true,
      },
    });
    expect(result).toMatchObject({
      article19SHistoryValid: false,
      legalStatus: "active",
      resultTranche: "early",
      advances: false,
    });
    expect(assessGoal({
      ...base,
      currentTranche: "early",
      article19SHistory: {
        kind: "reentry-from-2025-after-early-exit",
        evaluationAttempt: "first",
        reentryEvaluationDue: true,
      },
    }, "advanced").legalContinuity).toBe(false);
  });

  it("does not apply the exit when the current process advances", () => {
    expect(calculateTrancheProgression({
      ...base,
      article19SHistory: { kind: "ordinary", systemEntryCohort: "from-2025", previousProcessWithoutAdvancement: true },
    })).toMatchObject({ resultTranche: "advanced", legalStatus: "active" });
  });

  it("does not treat an experience ceiling as an insufficient professional result", () => {
    expect(calculateTrancheProgression({
      ...base,
      experienceYears: 3,
      article19SHistory: { kind: "ordinary", systemEntryCohort: "from-2025", previousProcessWithoutAdvancement: true },
    })).toMatchObject({ resultTranche: "initial", legalStatus: "active" });
  });

  it("normaliza permanencia no finita", () => {
    expect(calculateTrancheProgression({
      ...base,
      currentTranche: "advanced",
      experienceYears: 12,
      yearsInCurrentTranche: Number.POSITIVE_INFINITY,
    }).resultTranche).toBe("advanced");
  });

  it("solo conserva Portafolio A o dos B consecutivas para el proceso siguiente", () => {
    const retainedA = calculateTrancheProgression({
      ...base,
      portfolioResult: { category: "A", status: "retained-a-next-process" },
      ecepResult: { category: "B", status: "rendered" },
    });
    const retainedConsecutiveB = calculateTrancheProgression({
      ...base,
      portfolioResult: { category: "B", status: "retained-consecutive-b-next-process" },
      ecepResult: { category: "A", status: "rendered" },
    });

    expect(retainedA).toMatchObject({ instrumentResultsValid: true, hasCurrentInstrument: true, resultTranche: "advanced" });
    expect(retainedConsecutiveB).toMatchObject({ instrumentResultsValid: true, hasCurrentInstrument: true, resultTranche: "advanced" });
  });

  it("solo conserva ECEP A o B en procesos posteriores", () => {
    const retainedEcep = calculateTrancheProgression({
      ...base,
      portfolioResult: { category: "C", status: "rendered" },
      ecepResult: { category: "B", status: "retained-following-process" },
    });

    expect(retainedEcep).toMatchObject({ instrumentResultsValid: true, hasCurrentInstrument: true, resultTranche: "advanced" });
  });

  it("rechaza resultados conservados incompatibles aunque se fuerce un input externo inválido", () => {
    const invalidPortfolio = { category: "C", status: "retained-a-next-process" } as unknown as TrancheProgressionInput["portfolioResult"];
    const invalidEcep = { category: "C", status: "retained-following-process" } as unknown as TrancheProgressionInput["ecepResult"];

    expect(isValidPortfolioResult(invalidPortfolio)).toBe(false);
    expect(isValidEcepResult(invalidEcep)).toBe(false);
    expect(calculateTrancheProgression({ ...base, portfolioResult: invalidPortfolio })).toMatchObject({
      instrumentResultsValid: false,
      resultTranche: "initial",
      advances: false,
    });
    expect(assessGoal({ ...base, ecepResult: invalidEcep }, "advanced")).toMatchObject({
      results: false,
      currentInstrument: false,
      reachableNextProcess: false,
    });
  });

  it("evalúa un tramo objetivo con los cuatro requisitos", () => {
    expect(assessGoal(base, "advanced")).toMatchObject({ experience: true, results: true, progressionAndPermanence: true, currentInstrument: true, reachableNextProcess: true });
  });

  it("describe el mínimo orientativo sin omitir combinaciones válidas de la matriz", () => {
    expect(minimumCombinationFor("initial")).toBe("cualquier combinación válida de la matriz");
    expect(minimumCombinationFor("early")).toContain("Temprano o superior");
    expect(RESULT_MATRIX.D.B).toBe("early");
    expect(RESULT_MATRIX.A.D).toBe("early");
  });
});
