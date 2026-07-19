import { PREVIRED_PARAMETERS } from "./previred.generated";

export type TrancheKey = "access" | "initial" | "early" | "advanced" | "expert1" | "expert2";
export type AfpKey = "capital" | "cuprum" | "habitat" | "modelo" | "planvital" | "provida" | "uno";

export interface PeriodParameters {
  id: string;
  label: string;
  reviewedAt: string;
  previred: typeof PREVIRED_PARAMETERS;
  uf: number;
  utm: number;
  hourlyRate: { basic: number; secondary: number };
  minimumTotal44h: number;
  brp: { title: number; mention: number };
  progression: Record<TrancheKey, number>;
  fixedComponent: Record<TrancheKey, number>;
  priority: { fixed: number; additionalFixed: number };
  afpCommission: Record<AfpKey, number>;
  pensionCapUf: number;
  unemploymentCapUf: number;
  taxBrackets: ReadonlyArray<{ upTo: number; factor: number; rebate: number }>;
  sources: ReadonlyArray<{ label: string; url: string }>;
}

export const JULY_2026_PARAMETERS: PeriodParameters = {
  id: "2026-07",
  label: "Julio de 2026",
  reviewedAt: "2026-07-18",
  previred: PREVIRED_PARAMETERS,
  uf: PREVIRED_PARAMETERS.values.uf,
  utm: PREVIRED_PARAMETERS.values.utm,
  hourlyRate: { basic: 19992, secondary: 21034 },
  minimumTotal44h: 969365,
  brp: { title: 351263, mention: 117091 },
  progression: { access: 19774, initial: 19774, early: 65162, advanced: 131142, expert1: 491641, expert2: 1058032 },
  fixedComponent: { access: 0, initial: 0, early: 0, advanced: 136111, expert1: 189045, expert2: 287346 },
  priority: { fixed: 66128, additionalFixed: 90743 },
  afpCommission: PREVIRED_PARAMETERS.values.afpCommission,
  pensionCapUf: PREVIRED_PARAMETERS.values.pensionCapUf,
  unemploymentCapUf: PREVIRED_PARAMETERS.values.unemploymentCapUf,
  taxBrackets: [
    { upTo: 967261.5, factor: 0, rebate: 0 },
    { upTo: 2149470, factor: 0.04, rebate: 38690.46 },
    { upTo: 3582450, factor: 0.08, rebate: 124669.26 },
    { upTo: 5015430, factor: 0.135, rebate: 321704.01 },
    { upTo: 6448410, factor: 0.23, rebate: 798169.86 },
    { upTo: 8597880, factor: 0.304, rebate: 1275352.2 },
    { upTo: 10747350, factor: 0.35, rebate: 1670854.68 },
    { upTo: Number.POSITIVE_INFINITY, factor: 0.4, rebate: 2208222.18 },
  ],
  sources: [
    { label: "CPEIP · Asignaciones Carrera Docente", url: "https://www.cpeip.cl/carrera-docente-asignaciones/" },
    { label: "SII · Impuesto Único", url: "https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026_art52.htm" },
    { label: "Previred · Indicadores previsionales", url: PREVIRED_PARAMETERS.sourceUrl },
  ],
};
