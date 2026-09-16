import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JULY_2026_PARAMETERS as P } from "@/data/parameters/2026-07";
import { calculateTeacherSalary } from "@/lib/calculation/calculate";
import TeacherSalaryExample from "@/components/TeacherSalaryExample";
import { createTeacherExampleInput, teacherExampleResult } from "./teacher";

const currency = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

describe("Caso docente completo", () => {
  it("matches an independently worked breakdown and current monthly deductions", () => {
    const result = calculateTeacherSalary(createTeacherExampleInput(), P);
    expect(result.earnings.filter((line) => line.amount > 0).map(({ id, amount }) => [id, amount])).toEqual([
      ["base", 904656], ["experience", 90827], ["tranche-experience", 90827],
      ["tranche-progression", 26228], ["tranche-fixed", 136111],
      ["brp-title", 351263], ["brp-mention", 117091],
    ]);
    const gross = 1717003;
    const capped = Math.min(gross, P.uf * P.pensionCapUf);
    const afp = Math.round(capped * (0.1 + P.afpCommission.habitat));
    const health = Math.round(capped * 0.07);
    const taxable = gross - afp - health;
    const bracket = P.taxBrackets.find((item) => taxable <= item.upTo)!;
    const tax = Math.max(0, Math.round(taxable * bracket.factor - bracket.rebate));
    expect(result.taxableBase).toBe(taxable);
    expect(result.totalEarnings).toBe(gross);
    expect(result.totalDiscounts).toBe(afp + health + tax);
    expect(result.netSalary).toBe(gross - afp - health - tax);
    expect(result.warnings).toEqual([]);
    expect(result).toEqual(teacherExampleResult);
  });

  it("creates fresh inputs so editing a loaded example does not change the published case", () => {
    const input = createTeacherExampleInput();
    input.basicHours = 1;
    input.manualItems.push({ id: "extra", name: "Otro", amount: 123, kind: "discount" });
    expect(createTeacherExampleInput().basicHours).toBe(20);
    expect(createTeacherExampleInput().manualItems).toEqual([]);
    expect(createTeacherExampleInput().paidBaseSalary).toBeUndefined();
  });

  it("publishes assumptions, both breakdowns and totals without client JavaScript", () => {
    const html = renderToStaticMarkup(<TeacherSalaryExample onLoad={() => {}} />);
    expect(html).toContain("20 h básicas + 24 h medias");
    expect(html).toContain("AFP Habitat");
    for (const line of [...teacherExampleResult.earnings, ...teacherExampleResult.discounts].filter((line) => line.amount > 0)) {
      expect(html).toContain(line.label);
      expect(html).toContain(currency(line.amount));
    }
    expect(html).toContain(currency(teacherExampleResult.netSalary));
    expect(html).toContain("Reemplaza los datos");
    expect(html).toContain(P.previred.sourceUrl);
  });
});
