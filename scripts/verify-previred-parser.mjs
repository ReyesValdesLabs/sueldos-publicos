import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parsePreviredText, sourceCandidates } from "./lib/parse-previred.mjs";

test("extrae y valida un documento Previred", async () => {
  const text = await readFile(new URL("./fixtures/previred-sample.txt", import.meta.url), "utf8");
  const result = parsePreviredText(text);
  assert.equal(result.remunerationPeriod, "2026-06");
  assert.equal(result.paymentPeriod, "2026-07");
  assert.equal(result.values.uf, 40820.31);
  assert.equal(result.values.utm, 71506);
  assert.equal(result.values.pensionCapUf, 90);
  assert.equal(result.values.unemploymentCapUf, 135.2);
  assert.equal(result.values.afpCommission.habitat, 0.0127);
});

test("genera alternativas para nombres variables de PDF", () => {
  const candidates = sourceCandidates(new Date("2026-07-18T12:00:00Z"));
  assert.ok(candidates.some((url) => url.endsWith("Indicadores-Previsionales-Previred-Junio-2026v2.pdf")));
  assert.ok(candidates.some((url) => url.includes("/2026/07/")));
});
