import { describe, expect, it } from "vitest";
import { RESULT_MATRIX, assessGoal, calculateTrancheProgression, experienceCeiling, minimumExperienceFor } from "./calculate";
import type { TrancheProgressionInput } from "./types";

const base: TrancheProgressionInput = {
  currentTranche: "initial",
  experienceYears: 4,
  yearsInCurrentTranche: 0,
  portfolioCategory: "A",
  ecepCategory: "B",
  renderedPortfolio: true,
  renderedEcep: true,
  enteredEarlyWithA: false,
  enteredAdvancedWithDoubleA: false,
  previousProcessWithoutAdvancement: false,
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
    expect(calculateTrancheProgression({ ...base, currentTranche: "advanced", portfolioCategory: "E", ecepCategory: "D" }).resultTranche).toBe("advanced");
    const noInstrument = calculateTrancheProgression({ ...base, renderedPortfolio: false, renderedEcep: false });
    expect(noInstrument.resultTranche).toBe("initial");
    expect(noInstrument.hasCurrentInstrument).toBe(false);
  });

  it("assigns Access to Initial when the four-year deadline expires without instruments", () => {
    const result = calculateTrancheProgression({ ...base, currentTranche: "access", renderedPortfolio: false, renderedEcep: false, accessDeadlineExpired: true });
    expect(result).toMatchObject({ resultTranche: "initial", legalStatus: "access-reassigned", advances: false });
  });

  it("reports the statutory exit on a second consecutive failed process in Initial or Early", () => {
    const initialExit = calculateTrancheProgression({ ...base, portfolioCategory: "E", ecepCategory: "D", previousProcessWithoutAdvancement: true });
    const earlyExit = calculateTrancheProgression({ ...base, currentTranche: "early", portfolioCategory: "D", ecepCategory: "D", previousProcessWithoutAdvancement: true });
    expect(initialExit).toMatchObject({ resultTranche: null, legalStatus: "exit", advances: false });
    expect(earlyExit).toMatchObject({ resultTranche: null, legalStatus: "exit", advances: false });
    expect(assessGoal({ ...base, portfolioCategory: "E", ecepCategory: "D", previousProcessWithoutAdvancement: true }, "advanced").legalContinuity).toBe(false);
  });

  it("does not apply the exit when the current process advances", () => {
    expect(calculateTrancheProgression({ ...base, previousProcessWithoutAdvancement: true })).toMatchObject({ resultTranche: "advanced", legalStatus: "active" });
  });

  it("evalúa un tramo objetivo con los cuatro requisitos", () => {
    expect(assessGoal(base, "advanced")).toMatchObject({ experience: true, results: true, progressionAndPermanence: true, currentInstrument: true, reachableNextProcess: true });
  });
});
