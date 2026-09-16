import { GUIDES_CONTENT_PUBLISHED_AT, GUIDES_CONTENT_REVIEWED_AT } from "@/data/site";
import { PREVIRED_PARAMETERS } from "@/data/parameters/previred.generated";

export interface GuideEntry {
  slug: string;
  title: string;
  description: string;
  audience: string;
  readingTime: string;
  publishedAt: string;
  reviewedAt: string;
  sources: { label: string; url: string }[];
}

const sharedDates = {
  publishedAt: GUIDES_CONTENT_PUBLISHED_AT,
  reviewedAt: GUIDES_CONTENT_REVIEWED_AT,
};

export const GUIDES: GuideEntry[] = [
  {
    ...sharedDates,
    slug: "como-leer-liquidacion-docente",
    title: "Cómo leer una liquidación docente, línea por línea",
    description: "Un método práctico para separar haberes, bases de cálculo, descuentos y sueldo líquido antes de buscar una diferencia.",
    audience: "Docentes municipales y SLEP",
    readingTime: "9 min",
    sources: [
      { label: "Estatuto Docente", url: "https://www.bcn.cl/leychile/navegar?idNorma=60439" },
      { label: "CPEIP — Asignaciones de Carrera Docente", url: "https://cpeip.cl/carrera-docente-asignaciones/" },
      { label: "SII — Impuesto Único 2026", url: "https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm" },
    ],
  },
  {
    ...sharedDates,
    slug: "diferencias-slep-daem-municipal",
    title: "SLEP, DAEM/DEM o municipal: cómo identificar tu régimen",
    description: "Una guía para elegir la calculadora por empleador y vínculo jurídico, sin confundir el lugar de trabajo con el estatuto aplicable.",
    audience: "Asistentes y personal administrativo",
    readingTime: "8 min",
    sources: [
      { label: "Ley N.º 21.040 — Educación Pública", url: "https://www.bcn.cl/leychile/navegar?idNorma=1111237" },
      { label: "Ley N.º 21.109 — Asistentes de la educación", url: "https://www.bcn.cl/leychile/navegar?idNorma=1123513" },
      { label: "Ley N.º 18.883 — Estatuto Administrativo Municipal", url: "https://www.bcn.cl/leychile/navegar?idNorma=30256" },
    ],
  },
  {
    ...sharedDates,
    slug: "comparar-calculo-con-liquidacion",
    title: "Cómo comparar la calculadora con tu liquidación sin perderte en el líquido",
    description: "Ordena la revisión por conceptos, bases y descuentos para encontrar la primera diferencia comprobable.",
    audience: "Todas las personas usuarias",
    readingTime: "8 min",
    sources: [
      { label: "Previred — indicadores previsionales utilizados", url: PREVIRED_PARAMETERS.sourceUrl },
      { label: "SII — Impuesto Único 2026", url: "https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm" },
    ],
  },
  {
    ...sharedDates,
    slug: "cotizaciones-salud-impuesto",
    title: "AFP, salud e Impuesto Único: tres bases que no conviene mezclar",
    description: "Explicación práctica de por qué el bruto, el imponible, el tributable y el líquido pueden cambiar de forma distinta.",
    audience: "Trabajadores dependientes",
    readingTime: "10 min",
    sources: [
      { label: "Superintendencia de Pensiones — comisiones AFP", url: "https://www.spensiones.cl/portal/institucional/594/w3-article-2815.html" },
      { label: "Superintendencia de Salud — cotizaciones", url: "https://www.superdesalud.gob.cl/tax-materias-isapres/cotizaciones-de-salud-3465/" },
      { label: "SII — Impuesto Único 2026", url: "https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm" },
    ],
  },
  {
    ...sharedDates,
    slug: "entender-progresion-tramo-docente",
    title: "Cómo interpretar una progresión de tramo docente",
    description: "Separa resultados de instrumentos, experiencia, progresión y permanencia antes de interpretar una proyección.",
    audience: "Docentes en Carrera Docente",
    readingTime: "9 min",
    sources: [
      { label: "CPEIP — Progresión en tramos", url: "https://cpeip.cl/carrera-docente-progresion-tramos/" },
      { label: "Estatuto Docente", url: "https://www.bcn.cl/leychile/navegar?idNorma=60439" },
      { label: "Decreto N.º 339 — Sistema de Reconocimiento", url: "https://www.bcn.cl/leychile/navegar?idNorma=1173378" },
    ],
  },
  {
    ...sharedDates,
    slug: "documentos-antes-de-calcular",
    title: "Qué documentos reunir antes de calcular tu remuneración",
    description: "Lista razonada de antecedentes para evitar que una selección aproximada produzca un resultado aparentemente preciso, pero incorrecto.",
    audience: "Todas las personas usuarias",
    readingTime: "7 min",
    sources: [
      { label: "Dirección del Trabajo — documentación laboral", url: "https://www.dt.gob.cl/portal/1626/w3-channel.html" },
      { label: "Portal de Transparencia", url: "https://www.portaltransparencia.cl/PortalPdT/" },
      { label: "Portal Docente", url: "https://portaldocente.mineduc.cl/" },
    ],
  },
];

export const findGuide = (slug: string) => GUIDES.find((guide) => guide.slug === slug);
