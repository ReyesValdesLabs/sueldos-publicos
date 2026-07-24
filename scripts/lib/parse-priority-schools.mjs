const DEPENDENCIES = [
  "Corporación Privada o de Administración Delegada",
  "Servicio Local de Educación (SLE)",
  "Particular Subvencionado",
  "Corporación Municipal",
  "Particular Pagado",
  "Municipal DAEM",
];

export const PUBLIC_DEPENDENCIES = new Set([
  "Servicio Local de Educación (SLE)",
  "Corporación Municipal",
  "Municipal DAEM",
]);

const escapedDependencies = DEPENDENCIES
  .map((dependency) => dependency.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

const ROW_PATTERN = new RegExp(
  `^\\s*(\\d+)\\s+(.+?)\\s+(${escapedDependencies})\\s+(\\d{4})\\s+(\\d{4})\\s+(\\d+(?:,\\d+)?)\\s*$`,
);

function isHeader(line) {
  return /^(?:RBD\b|Año\b|Proceso\b|Matrícula\b|Concentración\b)/i.test(line);
}

function normalizeName(value) {
  return value
    .replaceAll("Ð", "Ñ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePrioritySchoolText(text) {
  const rows = [];
  let pendingNameLines = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replaceAll("\f", "");
    const trimmed = line.trim();

    if (!trimmed || isHeader(trimmed)) continue;

    const match = line.match(ROW_PATTERN);
    if (!match) {
      pendingNameLines.push(trimmed);
      continue;
    }

    const [, rbd, rowName, dependence, processYear, enrollmentYear, concentration] = match;
    const name = normalizeName([...pendingNameLines, rowName].join(" "));
    pendingNameLines = [];

    rows.push({
      rbd: Number(rbd),
      name,
      dependence,
      priorityPercentage: Number(concentration.replace(",", ".")),
      processYear: Number(processYear),
      enrollmentYear: Number(enrollmentYear),
    });
  }

  return rows;
}
