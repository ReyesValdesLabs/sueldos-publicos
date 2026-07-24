import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parsePrioritySchoolText, PUBLIC_DEPENDENCIES } from "./lib/parse-priority-schools.mjs";

const DATA_PATH = fileURLToPath(new URL("../public/data/priority-schools-2026.json", import.meta.url));

test("parsea nombres de una o varias líneas y convierte coma decimal", () => {
  const sample = `
RBD   Nombre del Establecimiento                          Dependencia                  Año Proceso Año Matrícula Concentración
     L. POLI. BICENTENARIO DE EXCELENCIA ANTONIO VARAS
   7 DE LA BARRA                                       Servicio Local de Educación (SLE)      2026         2025               70,7
 100 ESCUELA                                           Corporación Municipal                  2026         2025                  0
13512 COLEGIO JOAQUIN VICUÐA LARRAIN                   Servicio Local de Educación (SLE)      2026         2025              76,58
2291 ESCUELA DIFERENCIAL TERESA NARETTO DE NICOLETTI Municipal DAEM                2026         2025              69,35
`;

  assert.deepEqual(parsePrioritySchoolText(sample), [
    {
      rbd: 7,
      name: "L. POLI. BICENTENARIO DE EXCELENCIA ANTONIO VARAS DE LA BARRA",
      dependence: "Servicio Local de Educación (SLE)",
      priorityPercentage: 70.7,
      processYear: 2026,
      enrollmentYear: 2025,
    },
    {
      rbd: 100,
      name: "ESCUELA",
      dependence: "Corporación Municipal",
      priorityPercentage: 0,
      processYear: 2026,
      enrollmentYear: 2025,
    },
    {
      rbd: 13512,
      name: "COLEGIO JOAQUIN VICUÑA LARRAIN",
      dependence: "Servicio Local de Educación (SLE)",
      priorityPercentage: 76.58,
      processYear: 2026,
      enrollmentYear: 2025,
    },
    {
      rbd: 2291,
      name: "ESCUELA DIFERENCIAL TERESA NARETTO DE NICOLETTI",
      dependence: "Municipal DAEM",
      priorityPercentage: 69.35,
      processYear: 2026,
      enrollmentYear: 2025,
    },
  ]);
});

test("el JSON publicado conserva trazabilidad, alcance público y valores válidos", async () => {
  const dataset = JSON.parse(await readFile(DATA_PATH, "utf8"));

  assert.equal(dataset.schemaVersion, 1);
  assert.equal(dataset.source.processYear, 2026);
  assert.equal(dataset.source.enrollmentYear, 2025);
  assert.match(dataset.source.documentUrl, /^https:\/\/cpeip\.cl\//);
  assert.match(dataset.source.sha256, /^[a-f0-9]{64}$/);
  assert.equal(dataset.source.includedRows, dataset.schools.length);
  assert.ok(dataset.schools.length > 6_000);

  for (const school of dataset.schools) {
    assert.ok(PUBLIC_DEPENDENCIES.has(school.dependence));
    assert.ok(Number.isInteger(school.rbd) && school.rbd > 0);
    assert.ok(school.name.length > 0);
    assert.ok(school.priorityPercentage >= 0 && school.priorityPercentage <= 100);
  }
});
