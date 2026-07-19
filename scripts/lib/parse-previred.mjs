const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const AFP_NAMES = ["capital", "cuprum", "habitat", "planvital", "provida", "modelo", "uno"];

const decimal = (value) => Number(value.replaceAll(".", "").replace(",", "."));
const period = (month, year) => `${year}-${String(MONTHS.indexOf(month.toLowerCase()) + 1).padStart(2, "0")}`;
const required = (match, label) => {
  if (!match) throw new Error(`No fue posible extraer ${label} del documento de Previred.`);
  return match;
};

export function parsePreviredText(text) {
  const payment = required(text.match(/Pagar\s+en\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+(\d{4})/i), "el período de pago");
  const remuneration = required(text.match(/Remuneraciones\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+(\d{4})/i), "el período de remuneración");
  const uf = required(text.match(/Al\s+\d{1,2}\s+de\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+\s+del\s+\d{4}:\s+\$\s*([\d.]+,\d{2})/i), "el valor UF");
  const utm = required(text.match(new RegExp(`${remuneration[1]}\\s+${remuneration[2]}\\s+\\$\\s*([\\d.]+)`, "i")), "el valor UTM");
  const pensionCap = required(text.match(/afiliados\s+a\s+una\s+AFP\s*\(([\d.,]+)\s*UF\)/i), "el tope imponible AFP");
  const unemploymentCap = required(text.match(/Seguro\s+de\s+Cesant[ií]a\s*\(([\d.,]+)\s*UF\)/i), "el tope del seguro de cesantía");

  const afpCommission = {};
  for (const afp of AFP_NAMES) {
    const rate = required(text.match(new RegExp(`^\\s*${afp}\\s+([\\d]+,[\\d]+)%`, "im")), `la tasa de AFP ${afp}`);
    const workerRate = decimal(rate[1]) / 100;
    const commission = Math.round((workerRate - 0.1) * 10000) / 10000;
    if (commission < 0 || commission > 0.05) throw new Error(`La comisión extraída para AFP ${afp} está fuera de rango.`);
    afpCommission[afp] = commission;
  }

  const values = {
    uf: decimal(uf[1]),
    utm: decimal(utm[1]),
    pensionCapUf: decimal(pensionCap[1]),
    unemploymentCapUf: decimal(unemploymentCap[1]),
    afpCommission,
  };

  if (values.uf < 20_000 || values.uf > 100_000) throw new Error("El valor UF extraído está fuera de rango.");
  if (values.utm < 30_000 || values.utm > 150_000) throw new Error("El valor UTM extraído está fuera de rango.");
  if (values.pensionCapUf < 50 || values.pensionCapUf > 150) throw new Error("El tope AFP extraído está fuera de rango.");
  if (values.unemploymentCapUf < 80 || values.unemploymentCapUf > 200) throw new Error("El tope AFC extraído está fuera de rango.");

  return {
    remunerationPeriod: period(remuneration[1], Number(remuneration[2])),
    paymentPeriod: period(payment[1], Number(payment[2])),
    values,
  };
}

export function sourceCandidates(date = new Date()) {
  const candidates = [];
  for (let offset = 0; offset < 3; offset += 1) {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - offset, 1));
    const year = target.getUTCFullYear();
    const monthNumber = String(target.getUTCMonth() + 1).padStart(2, "0");
    const month = MONTHS[target.getUTCMonth()];
    const names = [month[0].toUpperCase() + month.slice(1), month];
    const suffixes = ["v3", "-v3", "v2", "-v2", "-3", "-2", "-1", ""];
    for (const name of names) {
      for (const suffix of suffixes) {
        candidates.push(`https://www.previred.com/wp-content/uploads/${year}/${monthNumber}/Indicadores-Previsionales-Previred-${name}-${year}${suffix}.pdf`);
      }
    }
  }
  return [...new Set(candidates)];
}
