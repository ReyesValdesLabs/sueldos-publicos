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
  zoneBonus: {
    grade24Base: number;
    calculationBaseFactor: number;
    lowerGrossThreshold: number;
    upperGrossThreshold: number;
    fullImplementationUpToPercentage: number;
    implementationFactorAbovePercentage: number;
  };
  sources: ReadonlyArray<{ label: string; url: string }>;
}

export const JULY_2026_ASSISTANT_PARAMETERS: AssistantPeriodParameters = {
  id: "2026-07",
  label: "Julio de 2026",
  reviewedAt: "2026-07-24",
  technicalMinimum44h: 668_412,
  lowIncomeBonus: {
    maximum44h: 62_903,
    lowerThreshold44h: 673_687,
    upperThreshold44h: 761_741,
    reductionFactor: 0.71437,
  },
  zoneBonus: {
    // $179.647 (EUS, diciembre de 2022), reajustado y redondeado en cada vigencia:
    // 4,3% (dic. 2023), 3% (dic. 2024), 1,2% (ene. 2025), 0,64% (jun. 2025),
    // 2% (dic. 2025) y 1,4% (jun. 2026).
    grade24Base: 203_297,
    calculationBaseFactor: 0.617,
    // Umbrales originales de $1.400.000 y $1.600.000 reajustados en 1,4%
    // desde el 1 de junio de 2026, conforme al artículo 4 N.º 5 de la Ley 21.819.
    lowerGrossThreshold: 1_419_600,
    upperGrossThreshold: 1_622_400,
    fullImplementationUpToPercentage: 15,
    implementationFactorAbovePercentage: 0.5,
  },
  sources: [
    {
      label: "Ley N.º 21.109 · Estatuto de Asistentes de la Educación Pública",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1123513",
    },
    {
      label: "Ley N.º 21.806, artículo 1 · reajuste de 1,4% desde junio de 2026",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1221118",
    },
    {
      label: "Ley N.º 21.819 · bonificación de zona para asistentes SLEP",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1224471",
    },
    {
      label: "Hacienda · escala EUS base a diciembre de 2022",
      url: "https://www.hacienda.cl/transparencia/2023/per_remuneraciones.pdf",
    },
    {
      label: "Ley N.º 21.647 · reajuste desde diciembre de 2023",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1199483",
    },
    {
      label: "Ley N.º 21.724 · reajustes de diciembre de 2024 a junio de 2025",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1209939",
    },
  ],
};
