export interface DaemAssistantPeriodParameters {
  id: string;
  label: string;
  reviewedAt: string;
  minimumIncome: {
    monthly: number;
    maximumWeeklyHours: number;
    proportionalUpToWeeklyHours: number;
  };
  article59Bonus: {
    maximum44h: number;
    previousMonthGrossLimit: number;
  };
  lowIncomeBonus: {
    maximum44h: number;
    lowerThreshold44h: number;
    upperThreshold44h: number;
    reductionFactor: number;
  };
  sources: ReadonlyArray<{ label: string; url: string }>;
}

export const JULY_2026_DAEM_ASSISTANT_PARAMETERS: DaemAssistantPeriodParameters = {
  id: "2026-07",
  label: "Julio de 2026",
  reviewedAt: "2026-07-21",
  minimumIncome: {
    monthly: 539_000,
    maximumWeeklyHours: 44,
    proportionalUpToWeeklyHours: 30,
  },
  article59Bonus: {
    maximum44h: 38_320,
    previousMonthGrossLimit: 564_598,
  },
  lowIncomeBonus: {
    maximum44h: 62_903,
    lowerThreshold44h: 673_687,
    upperThreshold44h: 761_741,
    reductionFactor: 0.71437,
  },
  sources: [
    {
      label: "Ley N.º 21.751 · ingreso mínimo mensual 2026",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1214530",
    },
    {
      label: "Dirección del Trabajo · ingreso mínimo de asistentes",
      url: "https://www.dt.gob.cl/legislacion/1624/w3-article-121990.html",
    },
    {
      label: "Ley N.º 20.883 · artículo 59",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1084822",
    },
    {
      label: "Ley N.º 21.806 · beneficios 2026",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1221118",
    },
    {
      label: "Dirección del Trabajo · personal DAEM/DEM",
      url: "https://www.dt.gob.cl/legislacion/1624/w3-article-114418.html",
    },
  ],
};
