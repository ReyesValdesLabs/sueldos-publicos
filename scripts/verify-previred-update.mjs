import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  parseGeneratedParameters,
  validateOfficialPreviredUrl,
  validatePreviredUpdate,
} from "./lib/validate-previred-update.mjs";

const baseline = {
  schemaVersion: 1,
  source: "Previred",
  sourceUrl: "https://www.previred.com/wp-content/uploads/2026/07/Indicadores-Previsionales-Previred-Julio-2026.pdf",
  sourceUpdatedAt: "2026-07-13",
  remunerationPeriod: "2026-07",
  paymentPeriod: "2026-08",
  sourceHash: `sha256:${"a".repeat(64)}`,
  values: {
    uf: 40_844.79,
    utm: 71_649,
    pensionCapUf: 90,
    unemploymentCapUf: 135.2,
    afpCommission: {
      capital: 0.0144,
      cuprum: 0.0144,
      habitat: 0.0127,
      modelo: 0.0058,
      planvital: 0.0116,
      provida: 0.0145,
      uno: 0.0046,
    },
  },
};

const nextPeriod = () => ({
  ...structuredClone(baseline),
  sourceUrl: "https://www.previred.com/wp-content/uploads/2026/08/Indicadores-Previsionales-Previred-Agosto-2026.pdf",
  sourceUpdatedAt: "2026-08-13",
  remunerationPeriod: "2026-08",
  paymentPeriod: "2026-09",
  sourceHash: `sha256:${"b".repeat(64)}`,
  values: {
    ...structuredClone(baseline.values),
    uf: 41_100,
    utm: 72_000,
  },
});

test("acepta un nuevo período oficial con cambios acotados", () => {
  assert.equal(
    validatePreviredUpdate(baseline, nextPeriod(), { now: new Date("2026-08-20T12:00:00Z") }).remunerationPeriod,
    "2026-08",
  );
});

test("acepta una corrección acotada dentro del período vigente", () => {
  const corrected = nextPeriod();
  corrected.sourceUpdatedAt = "2026-07-20";
  corrected.remunerationPeriod = "2026-07";
  corrected.paymentPeriod = "2026-08";
  assert.doesNotThrow(() => validatePreviredUpdate(baseline, corrected, { now: new Date("2026-07-20T12:00:00Z") }));
});

test("rechaza fuentes que no sean PDF oficiales de Previred", () => {
  assert.throws(() => validateOfficialPreviredUrl("https://example.com/indicadores.pdf"), /previred\.com/);
  assert.throws(() => validateOfficialPreviredUrl("http://www.previred.com/indicadores.pdf"), /PDF HTTPS/);
});

test("rechaza retrocesos y períodos de pago incoherentes", () => {
  const backwards = nextPeriod();
  backwards.remunerationPeriod = "2026-06";
  backwards.paymentPeriod = "2026-07";
  assert.throws(
    () => validatePreviredUpdate(baseline, backwards, { now: new Date("2026-08-20T12:00:00Z") }),
    /retroceder/,
  );

  const wrongPayment = nextPeriod();
  wrongPayment.paymentPeriod = "2026-10";
  assert.throws(
    () => validatePreviredUpdate(baseline, wrongPayment, { now: new Date("2026-08-20T12:00:00Z") }),
    /período de pago/,
  );
});

test("rechaza valores plausibles que cambian de forma anómala", () => {
  const anomalous = nextPeriod();
  anomalous.values.uf = 50_000;
  assert.throws(
    () => validatePreviredUpdate(baseline, anomalous, { now: new Date("2026-08-20T12:00:00Z") }),
    /UF varió/,
  );
});

test("rechaza cambios excesivos de comisión AFP", () => {
  const anomalous = nextPeriod();
  anomalous.values.afpCommission.habitat = 0.02;
  assert.throws(
    () => validatePreviredUpdate(baseline, anomalous, { now: new Date("2026-08-20T12:00:00Z") }),
    /habitat varió/,
  );
});

test("parsea la copia TypeScript generada que usa el sitio", async () => {
  const source = await readFile(new URL("../src/data/parameters/previred.generated.ts", import.meta.url), "utf8");
  const parsed = parseGeneratedParameters(source);
  const periodDate = new Date(`${parsed.remunerationPeriod}-28T12:00:00Z`);
  assert.doesNotThrow(() => validatePreviredUpdate(null, parsed, { now: periodDate }));
  assert.equal(parsed.source, "Previred");
  assert.ok(parsed.values.uf > 0);
});
