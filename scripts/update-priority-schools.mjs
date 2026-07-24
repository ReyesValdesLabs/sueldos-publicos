import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { parsePrioritySchoolText, PUBLIC_DEPENDENCIES } from "./lib/parse-priority-schools.mjs";

const execFileAsync = promisify(execFile);
const SOURCE_URL = "https://cpeip.cl/wp-content/uploads/2026/03/Rex_2012_RBD_prioritarios.pdf";
const OUTPUT_PATH = fileURLToPath(new URL("../public/data/priority-schools-2026.json", import.meta.url));
const EXPECTED_PROCESS_YEAR = 2026;
const EXPECTED_ENROLLMENT_YEAR = 2025;

async function downloadPdf(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo descargar la fuente (${response.status} ${response.statusText}).`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.subarray(0, 4).equals(Buffer.from("%PDF"))) throw new Error("La fuente descargada no es un PDF.");
  return bytes;
}

async function extractTableText(pdfPath, textPath) {
  try {
    await execFileAsync("pdftotext", ["-f", "5", "-layout", pdfPath, textPath]);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error("Falta pdftotext (Poppler). Instálalo antes de regenerar los datos.");
    }
    throw error;
  }
}

function validateRows(rows, tableText) {
  const apparentRowCount = tableText
    .split(/\r?\n/)
    .filter((line) => /\b2026\s+2025\s+\d+(?:,\d+)?\s*$/.test(line))
    .length;

  if (rows.length !== apparentRowCount) {
    throw new Error(`El parser produjo ${rows.length} filas, pero el texto contiene ${apparentRowCount} filas aparentes.`);
  }
  if (rows.length < 16_000) throw new Error(`Se extrajeron solo ${rows.length} filas; se esperaban al menos 16.000.`);
  const rbds = new Set(rows.map((row) => row.rbd));
  if (rbds.size !== rows.length) throw new Error("La fuente contiene RBD duplicados o el parser unió filas incorrectamente.");

  for (const row of rows) {
    if (row.processYear !== EXPECTED_PROCESS_YEAR || row.enrollmentYear !== EXPECTED_ENROLLMENT_YEAR) {
      throw new Error(`Años inesperados en RBD ${row.rbd}: proceso ${row.processYear}, matrícula ${row.enrollmentYear}.`);
    }
    if (!Number.isFinite(row.priorityPercentage) || row.priorityPercentage < 0 || row.priorityPercentage > 100) {
      throw new Error(`Concentración inválida en RBD ${row.rbd}: ${row.priorityPercentage}.`);
    }
  }
}

async function main() {
  const workDir = await mkdtemp(join(tmpdir(), "priority-schools-"));

  try {
    const pdfBytes = await downloadPdf(SOURCE_URL);
    const pdfPath = join(workDir, "source.pdf");
    const textPath = join(workDir, "source.txt");
    await writeFile(pdfPath, pdfBytes);
    await extractTableText(pdfPath, textPath);

    const tableText = await readFile(textPath, "utf8");
    const rows = parsePrioritySchoolText(tableText);
    validateRows(rows, tableText);

    const schools = rows
      .filter((row) => PUBLIC_DEPENDENCIES.has(row.dependence))
      .sort((left, right) => left.rbd - right.rbd);

    const dataset = {
      schemaVersion: 1,
      source: {
        publisher: "Ministerio de Educación de Chile / CPEIP",
        title: "Resolución Exenta N.º 1.522 de 25 de marzo de 2026 (Solicitud N.º 2.012)",
        documentUrl: SOURCE_URL,
        processYear: EXPECTED_PROCESS_YEAR,
        enrollmentYear: EXPECTED_ENROLLMENT_YEAR,
        publishedAt: "2026-03-25",
        retrievedAt: new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" }),
        sha256: createHash("sha256").update(pdfBytes).digest("hex"),
        scope: "Establecimientos públicos dependientes de SLEP, DAEM o corporaciones municipales",
        totalRowsInSource: rows.length,
        includedRows: schools.length,
      },
      schools,
    };

    await mkdir(dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, `${JSON.stringify(dataset)}\n`);
    console.log(`Datos guardados: ${schools.length} establecimientos públicos de ${rows.length} filas fuente.`);
    console.log(`Salida: ${OUTPUT_PATH}`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

await main();
