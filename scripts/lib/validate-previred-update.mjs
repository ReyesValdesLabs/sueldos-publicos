const AFP_NAMES = ["capital", "cuprum", "habitat", "modelo", "planvital", "provida", "uno"];
const PERIOD_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const LIMITS = {
  uf: { min: 20_000, max: 100_000, relativeChange: 0.1, label: "UF" },
  utm: { min: 30_000, max: 150_000, relativeChange: 0.1, label: "UTM" },
  pensionCapUf: { min: 50, max: 150, relativeChange: 0.2, label: "tope AFP" },
  unemploymentCapUf: { min: 80, max: 200, relativeChange: 0.2, label: "tope AFC" },
};

function monthIndex(period, label) {
  const match = period?.match(PERIOD_PATTERN);
  if (!match) throw new Error(`${label} debe usar el formato AAAA-MM.`);
  return Number(match[1]) * 12 + Number(match[2]) - 1;
}

function periodFromIndex(index) {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function assertFiniteNumber(value, { min, max, label }) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} está fuera del rango permitido (${min}–${max}).`);
  }
}

function assertRelativeChange(previous, next, { relativeChange, label }) {
  const change = Math.abs(next - previous) / previous;
  if (change > relativeChange) {
    throw new Error(`${label} varió ${(change * 100).toFixed(2)}%, sobre el máximo permitido de ${relativeChange * 100}%.`);
  }
}

export function validateOfficialPreviredUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("La fuente Previred no es una URL válida.");
  }
  const officialHost = url.hostname === "previred.com" || url.hostname.endsWith(".previred.com");
  if (url.protocol !== "https:" || !officialHost || !url.pathname.toLowerCase().endsWith(".pdf")) {
    throw new Error("La fuente debe ser un PDF HTTPS alojado en previred.com.");
  }
  return url.toString();
}

export function parseGeneratedParameters(source) {
  const match = source.match(/export const PREVIRED_PARAMETERS = ([\s\S]+) as const;\s*$/);
  if (!match) throw new Error("La copia previsional existente no tiene el formato generado esperado.");
  try {
    return JSON.parse(match[1]);
  } catch {
    throw new Error("La copia previsional existente no contiene JSON válido.");
  }
}

export function validatePreviredUpdate(previous, next, { now = new Date() } = {}) {
  if (next?.schemaVersion !== 1 || next?.source !== "Previred") {
    throw new Error("La actualización no conserva el esquema y proveedor Previred esperados.");
  }

  validateOfficialPreviredUrl(next.sourceUrl);
  if (!/^sha256:[a-f0-9]{64}$/.test(next.sourceHash ?? "")) {
    throw new Error("La actualización no contiene una huella SHA-256 válida.");
  }
  const sourceDate = new Date(`${next.sourceUpdatedAt}T00:00:00Z`);
  if (
    !DATE_PATTERN.test(next.sourceUpdatedAt ?? "")
    || !Number.isFinite(sourceDate.getTime())
    || sourceDate.toISOString().slice(0, 10) !== next.sourceUpdatedAt
  ) {
    throw new Error("La fecha de actualización de la fuente no es válida.");
  }
  if (sourceDate.getTime() > now.getTime() + 2 * 24 * 60 * 60 * 1_000) {
    throw new Error("La fecha de actualización de la fuente no puede estar en el futuro.");
  }

  const remunerationIndex = monthIndex(next.remunerationPeriod, "El período de remuneración");
  const paymentIndex = monthIndex(next.paymentPeriod, "El período de pago");
  if (paymentIndex !== remunerationIndex + 1) {
    throw new Error(`El período de pago debe ser ${periodFromIndex(remunerationIndex + 1)}.`);
  }

  const currentMonthIndex = now.getUTCFullYear() * 12 + now.getUTCMonth();
  if (remunerationIndex > currentMonthIndex) {
    throw new Error("El período de remuneración no puede estar en el futuro.");
  }

  for (const [key, limits] of Object.entries(LIMITS)) {
    assertFiniteNumber(next.values?.[key], limits);
  }

  const commissionNames = Object.keys(next.values?.afpCommission ?? {}).sort();
  if (commissionNames.join(",") !== AFP_NAMES.join(",")) {
    throw new Error("La actualización debe contener exactamente las siete AFP reconocidas.");
  }
  for (const name of AFP_NAMES) {
    assertFiniteNumber(next.values.afpCommission[name], { min: 0, max: 0.03, label: `Comisión AFP ${name}` });
  }

  if (!previous) return next;

  const previousIndex = monthIndex(previous.remunerationPeriod, "El período previsional vigente");
  if (remunerationIndex < previousIndex) {
    throw new Error("La actualización no puede retroceder el período de remuneración.");
  }
  if (remunerationIndex - previousIndex > 3) {
    throw new Error("La actualización no puede saltar más de tres períodos sin revisión manual.");
  }

  for (const [key, limits] of Object.entries(LIMITS)) {
    assertFiniteNumber(previous.values?.[key], limits);
    assertRelativeChange(previous.values[key], next.values[key], limits);
  }
  for (const name of AFP_NAMES) {
    const previousCommission = previous.values?.afpCommission?.[name];
    assertFiniteNumber(previousCommission, { min: 0, max: 0.03, label: `Comisión AFP ${name} vigente` });
    const difference = Math.abs(next.values.afpCommission[name] - previousCommission);
    if (difference > 0.005) {
      throw new Error(`La comisión AFP ${name} varió más de 0,5 puntos porcentuales.`);
    }
  }

  return next;
}
