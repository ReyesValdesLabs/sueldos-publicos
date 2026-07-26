import { describe, expect, it } from "vitest";
import { JULY_2026_PARAMETERS as P } from "@/data/parameters/2026-07";
import { findLegalEntry } from "./legal";

describe("Asignación por tramo legal table", () => {
  it("mirrors the current CPEIP amounts from the period parameters", () => {
    const table = findLegalEntry("asignacion-tramo")?.amountTable;

    expect(table?.description).toContain("junio de 2026");
    expect(table?.groups).toEqual([
      {
        component: "Componente de progresión",
        rows: [
          { label: "Acceso", amount: P.progression.access },
          { label: "Inicial", amount: P.progression.initial },
          { label: "Temprano", amount: P.progression.early },
          { label: "Avanzado", amount: P.progression.advanced },
          { label: "Experto I", amount: P.progression.expert1 },
          { label: "Experto II", amount: P.progression.expert2 },
        ],
      },
      {
        component: "Componente fijo",
        rows: [
          { label: "Avanzado", amount: P.fixedComponent.advanced },
          { label: "Experto I", amount: P.fixedComponent.expert1 },
          { label: "Experto II", amount: P.fixedComponent.expert2 },
        ],
      },
      {
        component: "Valor hora",
        rows: [
          { label: "Básica", amount: P.hourlyRate.basic },
          { label: "Media", amount: P.hourlyRate.secondary },
        ],
      },
    ]);
    expect(table?.source.url).toBe("https://cpeip.cl/carrera-docente-asignaciones/");
  });
});

describe("Respaldo de administrativos DAEM y municipales", () => {
  it("keeps the three regimes and their main exclusions traceable", () => {
    const entry = findLegalEntry("administrativos-daem-municipales");
    const explanation = entry?.explanation.join(" ") ?? "";
    const notes = entry?.notes.join(" ") ?? "";

    expect(explanation).toContain("establecimiento educacional municipal");
    expect(explanation).toContain("nivel central");
    expect(explanation).toContain("planta o contrata");
    expect(explanation).toContain("2% del sueldo base");
    expect(explanation).toContain("cuota completa pagada en julio");
    expect(notes).toContain("no se les descuenta AFC");
    expect(notes).toContain("nivel central DAEM/DEM no concede");
    expect(notes).toContain("IPS queda fuera");
    expect(entry?.sources.some((source) => source.label.includes("Resolución Exenta N.º 80"))).toBe(true);
    expect(entry?.sources.some((source) => source.label.includes("Superintendencia de Pensiones"))).toBe(true);
  });
});
