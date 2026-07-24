import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { normalizeSchoolZoneRows } from "./lib/normalize-school-zones.mjs";

const DATA_PATH = fileURLToPath(new URL("../public/data/school-zones-2025.json", import.meta.url));

test("normaliza solo valores mensuales consistentes y conserva los faltantes", () => {
  const rows = [
    { rbd: 1, zoneValues: [40], ruralValues: [1], monthsObserved: [2, 1, 2] },
    { rbd: 2, zoneValues: [0, 10], ruralValues: [0], monthsObserved: [1, 2] },
    { rbd: 3, zoneValues: [], ruralValues: [], monthsObserved: [] },
  ];

  assert.deepEqual(normalizeSchoolZoneRows(rows, new Set([1, 2, 3])), [
    { rbd: 1, zonePercentage: 40, rural: true, monthsObserved: [1, 2], consistent: true },
    { rbd: 2, zonePercentage: null, rural: false, monthsObserved: [1, 2], consistent: false },
    { rbd: 3, zonePercentage: null, rural: null, monthsObserved: [], consistent: false },
  ]);
});

test("el JSON publicado conserva fuente, cobertura y valores válidos", async () => {
  const dataset = JSON.parse(await readFile(DATA_PATH, "utf8"));

  assert.equal(dataset.schemaVersion, 1);
  assert.equal(dataset.source.dataYear, 2025);
  assert.match(dataset.source.datasetUrl, /^https:\/\/datosabiertos\.mineduc\.cl\//);
  assert.match(dataset.source.downloadUrl, /^https:\/\/datosabiertos\.mineduc\.cl\//);
  assert.match(dataset.source.sha256, /^[a-f0-9]{64}$/);
  assert.equal(dataset.source.includedRows, dataset.schools.length);
  assert.ok(dataset.schools.length > 6_000);

  const rbds = new Set();
  for (const school of dataset.schools) {
    assert.ok(Number.isInteger(school.rbd) && school.rbd > 0);
    assert.ok(!rbds.has(school.rbd));
    rbds.add(school.rbd);
    assert.ok(school.zonePercentage === null || school.zonePercentage >= 0 && school.zonePercentage <= 600);
    assert.ok(school.rural === null || typeof school.rural === "boolean");
    assert.ok(school.monthsObserved.every((month) => Number.isInteger(month) && month >= 1 && month <= 12));
  }

  const selectedExample = dataset.schools.find((school) => school.rbd === 2755);
  assert.deepEqual(selectedExample, {
    rbd: 2755,
    zonePercentage: 0,
    rural: true,
    monthsObserved: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    consistent: true,
  });
});
