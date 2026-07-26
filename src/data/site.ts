export const SITE = {
  name: "Sueldos Públicos",
  url: "https://sueldospublicos.cl/",
  description: "Calculadoras de sueldos públicos en Chile para docentes y asistentes de la educación.",
  organizationId: "https://sueldospublicos.cl/#organization",
  websiteId: "https://sueldospublicos.cl/#website",
  logoUrl: "https://sueldospublicos.cl/sueldospublicos-mark.png",
  socialImageUrl: "https://sueldospublicos.cl/og.png",
  githubUrl: "https://github.com/ReyesValdesLabs/sueldos-publicos",
  issuesUrl: "https://github.com/ReyesValdesLabs/sueldos-publicos/issues/new",
  publishedAt: "2026-07-18",
  updatedAt: "2026-07-25",
} as const;

export const LEGAL_CONTENT_PUBLISHED_AT = "2026-07-18";
export const LEGAL_CONTENT_REVIEWED_AT = "2026-07-25";

export const STATIC_PAGE_LAST_MODIFIED = {
  "": SITE.updatedAt,
  "calculadoras/docentes/": SITE.updatedAt,
  "calculadoras/tecnicos-parvulos/": SITE.updatedAt,
  "calculadoras/tramos-docentes/": SITE.updatedAt,
  "legal/": LEGAL_CONTENT_REVIEWED_AT,
  "acerca-de/": SITE.updatedAt,
  "metodologia/": SITE.updatedAt,
  "contacto/": SITE.updatedAt,
  "privacidad/": SITE.updatedAt,
  "terminos/": SITE.updatedAt,
} as const;
