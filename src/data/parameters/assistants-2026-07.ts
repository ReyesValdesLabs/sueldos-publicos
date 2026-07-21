export interface AssistantPeriodParameters {
  id: string;
  label: string;
  reviewedAt: string;
  technicalMinimum44h: number;
  lowIncomeBonus: {
    maximum44h: number;
    lowerThreshold44h: number;
    upperThreshold44h: number;
    reductionFactor: number;
  };
  sources: ReadonlyArray<{ label: string; url: string }>;
}

export const JULY_2026_ASSISTANT_PARAMETERS: AssistantPeriodParameters = {
  id: "2026-07",
  label: "Julio de 2026",
  reviewedAt: "2026-07-21",
  technicalMinimum44h: 668_412,
  lowIncomeBonus: {
    maximum44h: 62_903,
    lowerThreshold44h: 673_687,
    upperThreshold44h: 761_741,
    reductionFactor: 0.71437,
  },
  sources: [
    {
      label: "Ley N.º 21.109 · Estatuto de Asistentes de la Educación Pública",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1123513",
    },
    {
      label: "Ley N.º 21.806 · Reajuste y beneficios 2026",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1221118",
    },
  ],
};
