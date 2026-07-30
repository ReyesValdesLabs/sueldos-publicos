import { describe, expect, it } from "vitest";
import {
  availableEcepStatuses,
  availablePortfolioStatuses,
  buildEcepResult,
  buildPortfolioResult,
  trancheResultStatus,
} from "./TrancheCalculator";

describe("controles de vigencia de resultados conservados", () => {
  it("ofrece conservación de Portafolio solo para A o dos B consecutivas", () => {
    expect(availablePortfolioStatuses("A").map(({ value }) => value)).toEqual(["rendered", "retained-a-next-process"]);
    expect(availablePortfolioStatuses("B").map(({ value }) => value)).toEqual(["rendered", "retained-consecutive-b-next-process"]);
    expect(availablePortfolioStatuses("C").map(({ value }) => value)).toEqual(["rendered"]);
    expect(availablePortfolioStatuses("D").map(({ value }) => value)).toEqual(["rendered"]);
    expect(availablePortfolioStatuses("E").map(({ value }) => value)).toEqual(["rendered"]);
  });

  it("ofrece conservación de ECEP solo para A o B", () => {
    expect(availableEcepStatuses("A").map(({ value }) => value)).toEqual(["rendered", "retained-following-process"]);
    expect(availableEcepStatuses("B").map(({ value }) => value)).toEqual(["rendered", "retained-following-process"]);
    expect(availableEcepStatuses("C").map(({ value }) => value)).toEqual(["rendered"]);
    expect(availableEcepStatuses("D").map(({ value }) => value)).toEqual(["rendered"]);
  });

  it("vuelve a rendido al cambiar a una categoría incompatible", () => {
    expect(buildPortfolioResult("C", "retained-a-next-process")).toEqual({ category: "C", status: "rendered" });
    expect(buildPortfolioResult("A", "retained-consecutive-b-next-process")).toEqual({ category: "A", status: "rendered" });
    expect(buildEcepResult("C", "retained-following-process")).toEqual({ category: "C", status: "rendered" });
  });
});

describe("estado visible de las consecuencias del artículo 19 S", () => {
  it("no presenta como salida general la primera desvinculación posterior al reingreso", () => {
    expect(trancheResultStatus({
      legalStatus: "exit",
      exitConsequence: "reentry-first-same-sponsor",
      instrumentResultsValid: true,
      hasCurrentInstrument: true,
      advances: false,
    }, "initial")).toBe("DESVINCULACIÓN — MISMO SOSTENEDOR");
  });

  it("mantiene la salida general para la segunda evaluación insuficiente desde el reingreso", () => {
    expect(trancheResultStatus({
      legalStatus: "exit",
      exitConsequence: "reentry-second-all-system",
      instrumentResultsValid: true,
      hasCurrentInstrument: true,
      advances: false,
    }, "initial")).toBe("SALIDA DEL SISTEMA");
  });
});
