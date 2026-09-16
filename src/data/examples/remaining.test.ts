import { calculateTeacherSalary } from "@/lib/calculation/calculate";
import { createTeacherExampleInput } from "./teacher";
import { describe, expect, it } from "vitest";
import { createAssistantExampleInput, assistantExampleResult } from "./assistant";
import { createAdministrativeExampleInput, administrativeExampleResult } from "./administrative";
import { createTrancheExampleInput, trancheExampleResult } from "./tranche";
import { calculateAdministrativeSalary } from "@/lib/administrative-calculation/calculate";
import { calculateTrancheProgression } from "@/lib/tranche-progression/calculate";
import { JULY_2026_ASSISTANT_PARAMETERS as A } from "@/data/parameters/assistants-2026-07";

describe("Casos editoriales restantes", () => {
  it("comprueba el ejemplo BRP parcial y el máximo a 30 horas", () => {
    const amounts = (hours: number) => calculateTeacherSalary({...createTeacherExampleInput(), basicHours:hours, secondaryHours:0}).earnings.filter(x => x.id.startsWith("brp-")).map(x => x.amount);
    expect(amounts(20)).toEqual([234175, 78061]);
    expect(amounts(30)).toEqual([351263, 117091]);
    expect(amounts(44)).toEqual(amounts(30));
  });
  it("calcula AFC sobre el sueldo contractual y elimina solo el aporte personal con plazo fijo", () => {
    const fixed = calculateAdministrativeSalary({ ...createAdministrativeExampleInput(), contractType: "fixed" });
    expect(administrativeExampleResult.totalEarnings).toBe(900000);
    expect(administrativeExampleResult.discounts.find(x => x.id === "afc")?.amount).toBe(5400);
    expect(fixed.discounts.find(x => x.id === "afc")?.amount ?? 0).toBe(0);
    expect(fixed.totalEarnings).toBe(administrativeExampleResult.totalEarnings);
    expect(administrativeExampleResult.calculationComplete).toBe(true);
  });
  it("mantiene el mínimo SLEP y agrega dos bienios reconocidos", () => {
    expect(assistantExampleResult.minimumTarget).toBe(A.technicalMinimum44h);
    expect(assistantExampleResult.earnings.find(x => x.id === "assistant-experience")?.amount).toBe(Math.round(A.technicalMinimum44h * 0.04));
    expect(assistantExampleResult.supported).toBe(true);
  });
  it("preserva el bruto menos descuentos y aísla los datos recargados", () => {
    for (const r of [assistantExampleResult, administrativeExampleResult]) expect(r.netSalary).toBe(r.totalEarnings - r.totalDiscounts);
    const first = createAssistantExampleInput(); first.manualItems.push({id:"x",name:"extra",amount:1,kind:"discount"});
    expect(createAssistantExampleInput().manualItems).toEqual([]);
    const input = createTrancheExampleInput(); input.portfolioResult.category = "E";
    expect(createTrancheExampleInput().portfolioResult.category).toBe("A");
  });
  it("reduce el techo por experiencia sin cambiar los instrumentos", () => {
    const younger = calculateTrancheProgression({...createTrancheExampleInput(), experienceYears:0});
    expect(trancheExampleResult.legalStatus).toBe("active");
    expect(younger.matrixCeiling).toBe(trancheExampleResult.matrixCeiling);
    expect(younger.experienceCeiling).not.toBe(trancheExampleResult.experienceCeiling);
  });
});
