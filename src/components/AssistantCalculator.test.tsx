import { describe, expect, it } from "vitest";
import { findLegalEntry } from "@/data/legal";
import { ASSISTANT_EXPERIENCE_FIELD, isAssistantStepInvalid } from "./AssistantCalculator";

describe("AssistantCalculator experience guidance", () => {
  it("tells transferred assistants to include recognized pre-transfer service", () => {
    expect(ASSISTANT_EXPERIENCE_FIELD.label).toBe("Bienios reconocidos para esta asignación");
    expect(ASSISTANT_EXPERIENCE_FIELD.help).toContain("servicios previos al traspaso como asistente con el sostenedor municipal");
    expect(ASSISTANT_EXPERIENCE_FIELD.label).not.toContain("en el mismo SLEP");
  });

  it("traces the transferred-worker rule to the tenth transitional article", () => {
    const entry = findLegalEntry("asistentes-minimo-experiencia");

    expect(entry?.explanation.join(" ")).toContain("artículo décimo transitorio");
    expect(entry?.explanation.join(" ")).toContain("años previos servidos como asistente de la educación");
    expect(entry?.sources.some((source) => source.label.includes("décimo transitorio"))).toBe(true);
  });

  it("blocks the assignment step until the effective previous gross is declared for zone", () => {
    const base = {
      weeklyHours: 44,
      biennia: 0,
      difficultConditionsPercentage: 0,
      zonePercentage: 20,
      zonePreviousMonthGross: 0,
    };

    expect(isAssistantStepInvalid(1, base)).toBe(true);
    expect(isAssistantStepInvalid(1, { ...base, zonePreviousMonthGross: 1_419_600 })).toBe(false);
  });
});
