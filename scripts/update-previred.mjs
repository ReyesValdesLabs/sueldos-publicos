import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parsePreviredText, sourceCandidates } from "./lib/parse-previred.mjs";

const outputPath = fileURLToPath(new URL("../src/data/parameters/previred.generated.ts", import.meta.url));

async function downloadSource() {
  const explicit = process.env.PREVIRED_SOURCE_URL?.trim();
  const candidates = explicit ? [explicit] : sourceCandidates();
  for (const url of candidates) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 10_000 || bytes.subarray(0, 4).toString() !== "%PDF") continue;
      return { bytes, response, url };
    } catch {
      // La búsqueda continúa con el siguiente nombre posible publicado por Previred.
    }
  }
  throw new Error("Previred no publicó un PDF reconocible para los últimos tres meses.");
}

function renderGenerated(data) {
  return `// Archivo generado por scripts/update-previred.mjs. No editar manualmente.\nexport const PREVIRED_PARAMETERS = ${JSON.stringify(data, null, 2)} as const;\n`;
}

const temporary = await mkdtemp(join(tmpdir(), "sueldos-previred-"));
try {
  const { bytes, response, url } = await downloadSource();
  const pdfPath = join(temporary, "indicadores.pdf");
  const textPath = join(temporary, "indicadores.txt");
  await writeFile(pdfPath, bytes);
  const conversion = spawnSync("pdftotext", ["-layout", pdfPath, textPath], { encoding: "utf8" });
  if (conversion.status !== 0) throw new Error(`No se pudo convertir el PDF: ${conversion.stderr || "pdftotext no disponible"}`);
  const parsed = parsePreviredText(await readFile(textPath, "utf8"));
  const lastModified = response.headers.get("last-modified");
  const sourceUpdatedAt = lastModified ? new Date(lastModified).toISOString().slice(0, 10) : `${parsed.remunerationPeriod}-01`;
  const sourceHash = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
  const generated = {
    schemaVersion: 1,
    source: "Previred",
    sourceUrl: url,
    sourceUpdatedAt,
    remunerationPeriod: parsed.remunerationPeriod,
    paymentPeriod: parsed.paymentPeriod,
    sourceHash,
    values: parsed.values,
  };
  const next = renderGenerated(generated);
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current === next) {
    console.log(`Sin cambios: ${parsed.remunerationPeriod} ya está actualizado.`);
  } else {
    await writeFile(outputPath, next);
    console.log(`Actualizado: remuneraciones ${parsed.remunerationPeriod}, pago ${parsed.paymentPeriod}.`);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
