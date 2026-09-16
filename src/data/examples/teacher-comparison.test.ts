import { describe, expect, it } from "vitest";
import { teacherComparisonRows, teacherTwoBienniaResult, teacherEarning } from "./teacher-comparison";
import { teacherExampleResult } from "./teacher";

describe("Comparación editorial de bienios", () => {
  it("changes experience and progression while preserving the base, fixed component and BRP", () => {
    expect(teacherEarning(teacherTwoBienniaResult, "experience")).toBe(60702);
    expect(teacherEarning(teacherTwoBienniaResult, "tranche-experience")).toBe(60702);
    expect(teacherEarning(teacherTwoBienniaResult, "tranche-progression")).toBe(17486);
    for (const id of ["base", "tranche-fixed", "brp-title", "brp-mention"]) {
      expect(teacherEarning(teacherTwoBienniaResult, id)).toBe(teacherEarning(teacherExampleResult, id));
    }
    expect(teacherExampleResult.totalEarnings - teacherTwoBienniaResult.totalEarnings).toBe(68992);
    expect(teacherTwoBienniaResult.warnings).toEqual([]);
  });

  it("shows the first changed earning before the resulting totals and preserves the net identity", () => {
    expect(teacherComparisonRows.find((row) => row.two !== row.three)?.label).toBe("Asignación de experiencia");
    const gross = teacherComparisonRows.find((row) => row.label === "Total haberes")!;
    const discounts = teacherComparisonRows.find((row) => row.label === "Total descuentos")!;
    const net = teacherComparisonRows.find((row) => row.label === "Sueldo líquido")!;
    expect(net.three - net.two).toBe((gross.three - gross.two) - (discounts.three - discounts.two));
  });
});
