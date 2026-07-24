import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { normalizeSchoolZoneRows } from "./lib/normalize-school-zones.mjs";

const execFileAsync = promisify(execFile);
const SOURCE_PAGE_URL = "https://datosabiertos.mineduc.cl/subvenciones-a-establecimientos-educacionales/";
const SOURCE_DOWNLOAD_URL = "https://datosabiertos.mineduc.cl/wp-content/uploads/2026/06/Subvenciones-a-EE-2025.rar";
const OUTPUT_PATH = fileURLToPath(new URL("../public/data/school-zones-2025.json", import.meta.url));
const PRIORITY_DATA_PATH = fileURLToPath(new URL("../public/data/priority-schools-2026.json", import.meta.url));
const EXTRACTOR_PATH = fileURLToPath(new URL("./lib/extract-school-zones.py", import.meta.url));

async function downloadArchive(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo descargar la fuente (${response.status} ${response.statusText}).`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1_000_000) throw new Error("La descarga es demasiado pequeña para corresponder a la base oficial.");
  return bytes;
}

async function extractArchive(archivePath, workDir) {
  try {
    await execFileAsync("bsdtar", ["-xf", archivePath, "-C", workDir]);
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error("Falta bsdtar (libarchive) para extraer la descarga RAR.");
    throw error;
  }

  const files = await readdir(workDir);
  const workbook = files.find((name) => name.toLowerCase().endsWith(".xlsx"));
  if (!workbook) throw new Error("El archivo RAR no contiene el libro XLSX esperado.");
  return join(workDir, workbook);
}

async function parseWorkbook(workbookPath) {
  const python = process.env.SCHOOL_ZONES_PYTHON || "python3";
  try {
    const { stdout } = await execFileAsync(python, [EXTRACTOR_PATH, workbookPath], {
      maxBuffer: 50 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error(`No se encontró ${python}. Define SCHOOL_ZONES_PYTHON con una instalación de Python 3.`);
    throw error;
  }
}

function validateSchools(schools, expectedRbds) {
  if (schools.length < 6_000) throw new Error(`Solo se asociaron ${schools.length} RBD públicos; se esperaban al menos 6.000.`);
  if (schools.length !== expectedRbds.size) {
    throw new Error(`La base de zona cubre ${schools.length} de ${expectedRbds.size} RBD públicos.`);
  }

  const seen = new Set();
  for (const school of schools) {
    if (seen.has(school.rbd)) throw new Error(`RBD duplicado: ${school.rbd}.`);
    seen.add(school.rbd);
    if (school.zonePercentage !== null && (!Number.isFinite(school.zonePercentage) || school.zonePercentage < 0 || school.zonePercentage > 600)) {
      throw new Error(`Porcentaje de zona inválido en RBD ${school.rbd}: ${school.zonePercentage}.`);
    }
    if (school.rural !== null && typeof school.rural !== "boolean") {
      throw new Error(`Indicador rural inválido en RBD ${school.rbd}.`);
    }
    if (!school.monthsObserved.every((month) => Number.isInteger(month) && month >= 1 && month <= 12)) {
      throw new Error(`Mes inválido en RBD ${school.rbd}.`);
    }
  }
}

async function main() {
  const workDir = await mkdtemp(join(tmpdir(), "school-zones-"));

  try {
    const archiveBytes = await downloadArchive(SOURCE_DOWNLOAD_URL);
    const archivePath = join(workDir, "source.rar");
    await writeFile(archivePath, archiveBytes);
    const workbookPath = await extractArchive(archivePath, workDir);
    const extracted = await parseWorkbook(workbookPath);

    const priorityDataset = JSON.parse(await readFile(PRIORITY_DATA_PATH, "utf8"));
    const publicRbds = new Set(priorityDataset.schools.map((school) => school.rbd));
    const schools = normalizeSchoolZoneRows(extracted.schools, publicRbds);
    validateSchools(schools, publicRbds);

    const dataset = {
      schemaVersion: 1,
      source: {
        publisher: "Centro de Estudios, Ministerio de Educación de Chile",
        title: "Subvenciones a establecimientos educacionales 2025",
        datasetUrl: SOURCE_PAGE_URL,
        downloadUrl: SOURCE_DOWNLOAD_URL,
        dataYear: 2025,
        publishedAt: "2026-06",
        retrievedAt: new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" }),
        sha256: createHash("sha256").update(archiveBytes).digest("hex"),
        fields: {
          zonePercentage: "PORC_ZONA",
          rural: "RURAL_RBD",
        },
        consistencyRule: "Se publica un valor automático solo si todos los meses informados para el RBD coinciden.",
        totalRowsInSource: extracted.totalRows,
        includedRows: schools.length,
        consistentRows: schools.filter((school) => school.consistent).length,
        missingRows: schools.filter((school) => school.monthsObserved.length === 0).length,
      },
      schools,
    };

    await mkdir(dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, `${JSON.stringify(dataset)}\n`);
    console.log(`Actualizado ${OUTPUT_PATH} con ${schools.length} establecimientos (${dataset.source.consistentRows} consistentes).`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

await main();
